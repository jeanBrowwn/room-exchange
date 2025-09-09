import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Mood, UploadedFile, GenerationControls } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const isRoomEmpty = async (uploadedFile: UploadedFile): Promise<boolean> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: uploadedFile.mimeType,
                        data: uploadedFile.base64,
                    },
                },
                {
                    text: "Is this image of an empty room with no furniture or significant objects inside? Answer with only the word 'true' if it's empty, or 'false' if it contains furniture or other items.",
                },
            ],
        },
    });

    const resultText = response.text.trim().toLowerCase();
    return resultText === 'true';
};

export const generateMoods = async (uploadedFile: UploadedFile, controls: GenerationControls, referenceMoodFile: UploadedFile | null): Promise<Mood[]> => {
    // 1. Construct dynamic prompts based on controls and reference mood
    let constraints: string[] = [];
    constraints.push(controls.allowPaintChanges ? "You can change wall colors and textures." : "You must preserve the original wall colors and textures.");
    constraints.push(controls.allowFloorChanges ? "You can change the flooring." : "You must preserve the original flooring.");
    constraints.push(controls.removeFurniture ? "You must remove all existing furniture." : "You must keep the existing furniture, potentially altering its style to fit the new mood. To better illustrate the new mood, you should also add a few small, complementary decorative items or furniture pieces like plants, lamps, rugs, or a side table.");
    const constraintText = "It is critical to adhere to these constraints: " + constraints.join(' ');

    const requestParts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [
        {
            inlineData: {
                mimeType: uploadedFile.mimeType,
                data: uploadedFile.base64,
            },
        },
    ];

    if (referenceMoodFile) {
        requestParts.push({
             inlineData: {
                mimeType: referenceMoodFile.mimeType,
                data: referenceMoodFile.base64,
            },
        });
    }

    const textPrompt = referenceMoodFile
        ? `The first image is a room. The second is a reference mood. Generate 3 distinct mood variations for the room based *only* on the style, colors, and atmosphere of the reference mood. ${constraintText}`
        : `Based on the attached image of a room, generate 3 distinct and creative new interior design mood suggestions. ${constraintText}`;
        
    requestParts.push({ text: textPrompt });
    
    // 2. Generate textual mood descriptions
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: requestParts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "A short, evocative name for the mood." },
                        description: { type: Type.STRING, description: "A one-sentence description of the mood." },
                    },
                    required: ["name", "description"],
                },
            },
        },
    });

    const moodProposals: { name: string; description: string }[] = JSON.parse(textResponse.text);

    // 3. Generate an image for each mood
    const moodPromises = moodProposals.map(async (proposal) => {
        const imageGenText = `Transform this room to embody a '${proposal.name}: ${proposal.description}' mood. Preserve the original room's architecture and dimensions. ${constraintText} It is essential to furnish the room with appropriate, stylish furniture and accessories that match the mood, making it look functional and inviting. If the original room is empty, you must add furniture. Focus on creating a complete and inspiring scene.`;
        
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: uploadedFile.mimeType,
                            data: uploadedFile.base64,
                        },
                    },
                    {
                        text: imageGenText,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let imageUrl = '';
        for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
        
        if (!imageUrl) {
            console.warn("No image generated for mood:", proposal.name);
            imageUrl = `https://picsum.photos/seed/${encodeURIComponent(proposal.name)}/512/512`;
        }

        return { ...proposal, imageUrl };
    });

    return Promise.all(moodPromises);
};

export const generateEmptyRoomImage = async (originalFile: UploadedFile): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: originalFile.mimeType,
                        data: originalFile.base64,
                    },
                },
                {
                    text: "Remove all furniture and objects from this room. It is critical to preserve the original room's architecture, dimensions, walls, windows, doors, and flooring. The room should look completely empty and ready for new furniture.",
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Could not generate an empty room image.");
};

export const suggestRefinements = async (mood: Mood): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `For an interior with a '${mood.name}: ${mood.description}' style, suggest 3 actionable and creative refinement ideas. Frame them as suggestions. For example: "I would suggest you go for a berber carpet and a big mirror." or "How about adding some pampas grass in a ceramic vase?".`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        },
                        description: "A list of 3 refinement suggestions."
                    }
                },
                required: ["suggestions"]
            },
        },
    });
    
    const parsedResponse: { suggestions: string[] } = JSON.parse(response.text);
    return parsedResponse.suggestions;
};

const resizeImageOnCanvas = (objectImage: UploadedFile, targetWidth: number, targetHeight: number): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // Fill canvas with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Calculate new dimensions to fit object image while maintaining aspect ratio
            const aspectRatio = img.width / img.height;
            let newWidth = targetWidth;
            let newHeight = newWidth / aspectRatio;

            if (newHeight > targetHeight) {
                newHeight = targetHeight;
                newWidth = newHeight * aspectRatio;
            }

            // Calculate position to center the image
            const x = (targetWidth - newWidth) / 2;
            const y = (targetHeight - newHeight) / 2;

            // Draw the image on the canvas
            ctx.drawImage(img, x, y, newWidth, newHeight);

            // Get the new base64 data
            const dataUrl = canvas.toDataURL(objectImage.mimeType);
            const base64 = dataUrl.split(',')[1];

            resolve({
                ...objectImage,
                base64: base64,
            });
        };
        img.onerror = (err) => reject(new Error(`Failed to load object image: ${String(err)}`));
        img.src = `data:${objectImage.mimeType};base64,${objectImage.base64}`;
    });
};

const getBaseImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = (err) => reject(new Error(`Failed to load base image: ${String(err)}`));
        img.src = dataUrl;
    });
};

export const refineAndIntegrateObjects = async (baseImage: string, refinementPrompt: string, objectImages: UploadedFile[]): Promise<string> => {
    const getMimeType = (dataUrl: string) => dataUrl.split(';')[0].split(':')[1] || 'image/png';
    
    const parts: ({ inlineData: { mimeType: string; data: string; } } | { text: string })[] = [
        {
            inlineData: {
                mimeType: getMimeType(baseImage),
                data: baseImage.split(',')[1],
            },
        },
    ];

    let promptText = "This is the room. ";
    if (refinementPrompt) {
        promptText += `First, apply this refinement: "${refinementPrompt}". `;
    }

    let finalObjectImages = objectImages;

    if (objectImages.length > 0) {
        promptText += "Then, seamlessly integrate the following objects into the room. For each object, remove its background and place it realistically, respecting the room's perspective, lighting, scale, and style.";
        
        try {
            const { width: targetWidth, height: targetHeight } = await getBaseImageDimensions(baseImage);
            if (targetWidth > 0 && targetHeight > 0) {
                 finalObjectImages = await Promise.all(
                    objectImages.map(img => resizeImageOnCanvas(img, targetWidth, targetHeight))
                );
            } else {
                console.warn("Base image has zero dimensions, skipping object resize.");
            }
        } catch (error) {
            console.error("Failed to resize object images, using original images:", error);
        }
    }

    parts.push({ text: promptText });

    finalObjectImages.forEach(img => {
        parts.push({
            inlineData: {
                mimeType: img.mimeType,
                data: img.base64,
            }
        });
    });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Could not generate the final image.");
};