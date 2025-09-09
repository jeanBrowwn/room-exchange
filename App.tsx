import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Step, Mood, UploadedFile, GenerationControls, SavedMood } from './types';
import * as geminiService from './services/geminiService';
import Header from './components/Header';
import PhotoUploader from './components/PhotoUploader';
import Spinner from './components/Spinner';
import Stepper from './components/Stepper';
import ImageCompareSlider from './components/ImageCompareSlider';
import SplashScreen from './components/SplashScreen';
import SidePanel from './components/SidePanel';


const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: () => void; disabled: boolean; }> = ({ label, checked, onChange, disabled }) => (
    <label className={`flex items-center justify-between ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <span className="text-gray-700 font-medium dark:text-gray-300">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
    </label>
);

const App: React.FC = () => {
    const [step, setStep] = useState<Step>(Step.UPLOAD);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [referenceMoodFile, setReferenceMoodFile] = useState<UploadedFile | null>(null);
    const [controls, setControls] = useState<GenerationControls>({
        allowPaintChanges: true,
        allowFloorChanges: true,
        removeFurniture: true,
    });
    const [moods, setMoods] = useState<Mood[]>([]);
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [refinementPrompt, setRefinementPrompt] = useState<string>('');
    const [refinementHistory, setRefinementHistory] = useState<string[]>([]);
    const [refinementSuggestions, setRefinementSuggestions] = useState<string[]>([]);
    const [refinedImage, setRefinedImage] = useState<string>('');
    const [objectImages, setObjectImages] = useState<UploadedFile[]>([]);
    const [finalImage, setFinalImage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoadingApp, setIsLoadingApp] = useState(true);
    const [isFinishingSplash, setIsFinishingSplash] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [projectTitle, setProjectTitle] = useState('');
    const [savedMoods, setSavedMoods] = useState<SavedMood[]>([]);
    const [isSaved, setIsSaved] = useState(false);
    const [emptyRoomImage, setEmptyRoomImage] = useState<string>('');
    const [isFurnitureMode, setIsFurnitureMode] = useState<boolean>(false);
    

    const referenceMoodInputRef = useRef<HTMLInputElement>(null);
    const objectImageInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        // Load saved moods from localStorage on initial load
        try {
            const item = window.localStorage.getItem('savedMoods');
            if (item) {
                setSavedMoods(JSON.parse(item));
            }
        } catch (err) {
            console.error("Failed to load saved moods from localStorage:", err);
        }

        // Apply dark mode if user prefers, but don't offer a toggle
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }

        // Splash screen timers
        const timer1 = setTimeout(() => setIsFinishingSplash(true), 1500);
        const timer2 = setTimeout(() => setIsLoadingApp(false), 2000);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);
    
    useEffect(() => {
        // Scroll to top on step change to ensure user sees the new content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const isLoading = [
        Step.GENERATING_MOODS, 
        Step.REFINING_MOOD, 
        Step.GENERATING_FINAL_IMAGE
    ].includes(step);

    const handlePhotoUpload = useCallback(async (file: File) => {
        try {
            const base64 = await geminiService.fileToBase64(file);
            setUploadedFile({ base64, mimeType: file.type, name: file.name });
            setError('');
        } catch (err) {
            setError('Failed to process the image file. Please try another one.');
            console.error(err);
        }
    }, []);

    const handleReferenceMoodUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await geminiService.fileToBase64(file);
                setReferenceMoodFile({ base64, mimeType: file.type, name: file.name });
                setError('');
            } catch (err) {
                setError('Failed to process the reference mood image.');
                console.error(err);
            }
        }
    }, []);

    const handleObjectImagesUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            try {
                const newObjectPromises = Array.from(files).map(async (file) => {
                    const base64 = await geminiService.fileToBase64(file);
                    return { base64, mimeType: file.type, name: file.name };
                });
                const newObjects = await Promise.all(newObjectPromises);
                setObjectImages(prev => [...prev, ...newObjects]);
                setError('');
            } catch (err) {
                setError('Failed to process one or more object images.');
                console.error(err);
            }
        }
    }, []);

    const removeObjectImage = (index: number) => {
        setObjectImages(prev => prev.filter((_, i) => i !== index));
    };


    const handleControlChange = (controlName: keyof GenerationControls) => {
        setControls(prev => ({ ...prev, [controlName]: !prev[controlName] }));
    };

    const handleStartMoodGeneration = async () => {
        if (!uploadedFile) {
            setError('Please upload a photo of your space first.');
            return;
        }
        setStep(Step.GENERATING_MOODS);
        setError('');
        try {
            const isAlreadyEmpty = await geminiService.isRoomEmpty(uploadedFile);

            const emptyRoomImagePromise = isAlreadyEmpty
                ? Promise.resolve(`data:${uploadedFile.mimeType};base64,${uploadedFile.base64}`)
                : geminiService.generateEmptyRoomImage(uploadedFile);

            const [generatedMoods, emptyRoomImg] = await Promise.all([
                geminiService.generateMoods(uploadedFile, controls, referenceMoodFile),
                emptyRoomImagePromise
            ]);
            
            setMoods(generatedMoods);
            setEmptyRoomImage(emptyRoomImg);
            setStep(Step.MOODS_RESULT);
        } catch (err) {
            setError('Could not generate moods. Please try again.');
            setStep(Step.UPLOAD);
            console.error(err);
        }
    };
    
    const handleMoodSelect = async (mood: Mood) => {
        setIsFurnitureMode(false);
        setSelectedMood(mood);
        setRefinedImage(mood.imageUrl); 
        setStep(Step.REFINE_RESULT);
        setRefinementSuggestions([]);
        try {
            const suggestions = await geminiService.suggestRefinements(mood);
            setRefinementSuggestions(suggestions);
        } catch (err) {
            console.warn("Could not fetch refinement suggestions.", err);
        }
    };

    const handleFurnitureModeSelect = () => {
        setIsFurnitureMode(true);
        const furnitureMood = { 
            name: 'Furnitures Mode', 
            description: 'Start with a blank canvas and furnish your room from scratch.', 
            imageUrl: emptyRoomImage 
        };
        setSelectedMood(furnitureMood);
        setRefinedImage(emptyRoomImage);
        setStep(Step.REFINE_RESULT);
        setRefinementSuggestions([]);
    };
    
    const handleMakeItHappen = async () => {
        if (!refinedImage) return;

        if (!refinementPrompt && objectImages.length === 0) {
            setError("Please add a refinement instruction or upload objects.");
            return;
        }

        setStep(Step.GENERATING_FINAL_IMAGE);
        setError('');
        try {
            const image = await geminiService.refineAndIntegrateObjects(refinedImage, refinementPrompt, objectImages);
            setFinalImage(image);
            
            if (refinementPrompt) {
                setRefinementHistory(prev => [...prev, refinementPrompt]);
            }
            setRefinementPrompt('');
            
            setStep(Step.FINAL_RESULT);
            if (!projectTitle && selectedMood) {
               setProjectTitle(`${selectedMood.name} Vibe`);
            }
            
        } catch(err) {
            setError('Could not create the final image. Please try again.');
            setStep(Step.REFINE_RESULT);
            console.error(err);
        }
    };
    
    const handleSaveMood = () => {
        if (!projectTitle.trim()) {
            setError("Please enter a title for your mood before saving.");
            return;
        }
        if (!uploadedFile || !finalImage || !selectedMood) return;

        const newSavedMood: SavedMood = {
            id: Date.now().toString(),
            title: projectTitle,
            originalImage: uploadedFile,
            finalImage: finalImage,
            moodName: selectedMood.name,
            refinements: refinementHistory,
            addedObjects: objectImages,
        };
        const updatedMoods = [newSavedMood, ...savedMoods];
        setSavedMoods(updatedMoods);
        localStorage.setItem('savedMoods', JSON.stringify(updatedMoods));
        setIsSaved(true);
        setError('');
    };
    
    const handleLoadSavedMood = (moodId: string) => {
        const moodToLoad = savedMoods.find(m => m.id === moodId);
        if (moodToLoad) {
            setUploadedFile(moodToLoad.originalImage);
            setFinalImage(moodToLoad.finalImage);
            setSelectedMood({ name: moodToLoad.moodName, description: '', imageUrl: '' });
            setProjectTitle(moodToLoad.title);
            setRefinementHistory(moodToLoad.refinements);
            setObjectImages(moodToLoad.addedObjects);
            setStep(Step.FINAL_RESULT);
            setIsSidePanelOpen(false);
            setError('');
            setIsSaved(true); 
            setIsFurnitureMode(moodToLoad.moodName === 'Furnitures Mode');
        }
    };

    const handleRestart = () => {
        setStep(Step.UPLOAD);
        setUploadedFile(null);
        setReferenceMoodFile(null);
        setControls({ allowPaintChanges: true, allowFloorChanges: true, removeFurniture: true });
        setMoods([]);
        setSelectedMood(null);
        setRefinementPrompt('');
        setRefinementHistory([]);
        setRefinementSuggestions([]);
        setRefinedImage('');
        setObjectImages([]);
        setFinalImage('');
        setError('');
        setProjectTitle('');
        setIsSaved(false);
        setEmptyRoomImage('');
        setIsFurnitureMode(false);
    };

    const handleDownload = () => {
        if (!finalImage) return;

        const mimeType = finalImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';

        const link = document.createElement('a');
        link.href = finalImage;
        const filename = (projectTitle.trim().replace(/ /g, '_') || 'vibe_mood_result') + `.${extension}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getActiveStepIndex = (currentStep: Step): number => {
        switch (currentStep) {
            case Step.UPLOAD:
                return 0;
            case Step.GENERATING_MOODS:
            case Step.MOODS_RESULT:
                return 1;
            case Step.REFINING_MOOD:
            case Step.REFINE_RESULT:
            case Step.GENERATING_FINAL_IMAGE:
                return 2;
            case Step.FINAL_RESULT:
                return 3;
            default:
                return 0;
        }
    };

    const activeStepIndex = getActiveStepIndex(step);

    const handleStepClick = (index: number) => {
        if (index >= activeStepIndex) return; 
    
        switch (index) {
            case 0: 
                setStep(Step.UPLOAD);
                setMoods([]);
                setSelectedMood(null);
                setRefinementPrompt('');
                setRefinementHistory([]);
                setRefinementSuggestions([]);
                setRefinedImage('');
                setObjectImages([]);
                setFinalImage('');
                setError('');
                setProjectTitle('');
                setIsSaved(false);
                setEmptyRoomImage('');
                setIsFurnitureMode(false);
                break;
            case 1: 
                setStep(Step.MOODS_RESULT);
                setSelectedMood(null);
                setRefinementPrompt('');
                setRefinementHistory([]);
                setRefinementSuggestions([]);
                setRefinedImage('');
                setObjectImages([]);
                setFinalImage('');
                setError('');
                setIsSaved(false);
                setIsFurnitureMode(false);
                break;
            case 2: 
                 setStep(Step.REFINE_RESULT); 
                 setFinalImage('');
                 setError('');
                 setIsSaved(false);
                break;
            default:
                break;
        }
    };

    return (
        <>
            {isLoadingApp && <SplashScreen isFinishing={isFinishingSplash} />}
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
                <Header 
                    onMenuClick={() => setIsSidePanelOpen(true)}
                    showMenuButton={true}
                />
                <SidePanel 
                    isOpen={isSidePanelOpen}
                    onClose={() => setIsSidePanelOpen(false)}
                    currentUpload={uploadedFile}
                    savedMoods={savedMoods}
                    onLoadMood={handleLoadSavedMood}
                />
                <main className="container mx-auto p-4 md:p-8 max-w-6xl mt-24 flex-grow">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">{error}</div>}
                    
                    {uploadedFile && (
                        <Stepper 
                            steps={['Select a picture', 'Select Mood', 'Make it Your Own', 'Final Result']}
                            activeStepIndex={activeStepIndex}
                            onStepClick={handleStepClick}
                        />
                    )}

                    <div className="relative w-full overflow-hidden">
                        <div 
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${activeStepIndex * 100}%)` }}
                        >
                            {/* Slide 1: Upload & Configure */}
                            <div className="w-full flex-shrink-0 px-1">
                                <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm dark:bg-gray-800/60">
                                    <h2 className="text-2xl font-semibold mb-4 text-center dark:text-white">1. Select a Picture</h2>
                                    <PhotoUploader onPhotoUpload={handlePhotoUpload} disabled={isLoading} />
                                    {uploadedFile && (
                                        <div className="mt-6 space-y-4">
                                            <div className="p-4 bg-white rounded-lg shadow-md border dark:bg-gray-800 dark:border-gray-700 space-y-4">
                                                <h3 className="font-bold text-lg text-center dark:text-gray-100">Generation Controls</h3>
                                                <ToggleSwitch label="Allow paint changes" checked={controls.allowPaintChanges} onChange={() => handleControlChange('allowPaintChanges')} disabled={isLoading} />
                                                <ToggleSwitch label="Allow floor changes" checked={controls.allowFloorChanges} onChange={() => handleControlChange('allowFloorChanges')} disabled={isLoading} />
                                                <ToggleSwitch label="Remove furnitures" checked={controls.removeFurniture} onChange={() => handleControlChange('removeFurniture')} disabled={isLoading} />
                                            </div>
                                            <div className="p-4 bg-white rounded-lg shadow-md border dark:bg-gray-800 dark:border-gray-700">
                                                <h3 className="font-bold text-lg text-center mb-2 dark:text-gray-100">Upload Reference Mood (Optional)</h3>
                                                <input type="file" accept="image/*" onChange={handleReferenceMoodUpload} className="hidden" ref={referenceMoodInputRef} disabled={isLoading} />
                                                <button onClick={() => referenceMoodInputRef.current?.click()} disabled={isLoading} className="w-full text-center p-3 border-2 border-dashed rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition dark:border-gray-600 dark:hover:border-indigo-500 dark:hover:bg-gray-700">
                                                    {referenceMoodFile ? 'Change Reference Mood' : 'Select Reference Image'}
                                                </button>
                                                {referenceMoodFile && (
                                                    <div className="mt-4 text-center">
                                                        <img src={`data:${referenceMoodFile.mimeType};base64,${referenceMoodFile.base64}`} alt="Reference mood preview" className="max-h-32 w-auto mx-auto rounded-md shadow-sm" />
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={handleStartMoodGeneration} disabled={isLoading || !uploadedFile} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-50">
                                                Vibe mood it !
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Slide 2: Choose Mood */}
                            <div className="w-full flex-shrink-0 px-1">
                                <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm min-h-[300px] dark:bg-gray-800/60">
                                    {step === Step.GENERATING_MOODS && <Spinner message="Dreaming up new moods..." />}
                                    
                                    {step === Step.MOODS_RESULT && (
                                        <div className="text-center">
                                            <h2 className="text-2xl font-semibold mb-4 dark:text-white">2. Choose a New Mood</h2>
                                            <p className="text-gray-600 mb-4 dark:text-gray-400">{referenceMoodFile ? 'Based on your reference image, here are some variations:' : 'Here are a few new moods for your space:'}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {moods.map((mood, index) => (
                                                    <div key={index} onClick={() => handleMoodSelect(mood)} className="cursor-pointer bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-indigo-500">
                                                        <img src={mood.imageUrl} alt={mood.name} className="w-full h-48 object-cover"/>
                                                        <div className="p-4">
                                                            <h3 className="font-bold text-lg dark:text-gray-100">{mood.name}</h3>
                                                            <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">{mood.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                 {emptyRoomImage && (
                                                    <div onClick={handleFurnitureModeSelect} className="cursor-pointer bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-indigo-500">
                                                        <img src={emptyRoomImage} alt="Empty room for furniture mode" className="w-full h-48 object-cover"/>
                                                        <div className="p-4">
                                                            <h3 className="font-bold text-lg dark:text-gray-100">Furnitures Mode</h3>
                                                            <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">Start with a blank canvas and furnish your room from scratch.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Slide 3: Refine & Furnish */}
                            <div className="w-full flex-shrink-0 px-1">
                                <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm dark:bg-gray-800/60">
                                    <h2 className="text-2xl font-semibold mb-4 text-center dark:text-white">{isFurnitureMode ? '3. Furnish Your Room' : '3. Make It Your Own'}</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col">
                                        <img src={refinedImage} alt="Refined Mood" className="w-full rounded-lg shadow-xl border"/>
                                    </div>
                                    <div className="flex flex-col space-y-4">
                                        {isLoading && step !== Step.GENERATING_MOODS ? (
                                            <Spinner message={
                                                step === Step.REFINING_MOOD ? "Perfecting your chosen mood..." :
                                                "Adding items and finalizing the scene..."
                                            } />
                                        ) : (
                                            <>
                                                <div className="p-4 bg-white rounded-lg shadow-md border dark:bg-gray-800 dark:border-gray-700">
                                                    <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Refine Your Mood</h3>
                                                    {refinementSuggestions.length > 0 && (
                                                        <div className="mb-3 space-y-1 text-sm">
                                                            <p className="font-semibold text-gray-500 dark:text-gray-400">Suggestions:</p>
                                                            {refinementSuggestions.map((suggestion, index) => (
                                                                <button key={index} onClick={() => setRefinementPrompt(suggestion)} className="block text-left text-indigo-600 hover:underline dark:text-indigo-400">
                                                                    - "{suggestion}"
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="text"
                                                            value={refinementPrompt}
                                                            onChange={(e) => setRefinementPrompt(e.target.value)}
                                                            placeholder={isFurnitureMode ? 'e.g., "make the floor dark wood"' : 'e.g., "add a large window"'}
                                                            className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white rounded-lg shadow-md border dark:bg-gray-800 dark:border-gray-700">
                                                    <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Add Furnitures and Objects</h3>
                                                    <input type="file" accept="image/*" multiple onChange={handleObjectImagesUpload} className="hidden" ref={objectImageInputRef} disabled={isLoading} />
                                                    <button onClick={() => objectImageInputRef.current?.click()} disabled={isLoading} className="w-full text-center p-3 border-2 border-dashed rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition dark:border-gray-600 dark:hover:bg-gray-700">
                                                        Upload Images
                                                    </button>
                                                    {objectImages.length > 0 && (
                                                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {objectImages.map((img, i) => (
                                                                <div key={i} className="relative group">
                                                                    <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Object ${i + 1}`} className="w-full h-20 object-contain rounded-md bg-gray-100 border dark:bg-gray-700 dark:border-gray-600" />
                                                                    <button onClick={() => removeObjectImage(i)} className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <button onClick={handleMakeItHappen} disabled={isLoading || (!refinementPrompt && objectImages.length === 0)} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                                    {isFurnitureMode ? 'Furnish it !' : 'Make it happen !'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    </div>
                                </div>
                            </div>

                            {/* Slide 4: Final Result */}
                            <div className="w-full flex-shrink-0 px-1">
                                <div className="bg-white/60 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-sm text-center dark:bg-gray-800/60">
                                    <h2 className="text-2xl font-semibold mb-4 dark:text-white">4. Your New Room!</h2>
                                    {uploadedFile && finalImage ? (
                                        <>
                                            <ImageCompareSlider 
                                                originalImage={`data:${uploadedFile.mimeType};base64,${uploadedFile.base64}`}
                                                modifiedImage={finalImage}
                                            />
                                            <div className="mt-6 flex justify-center space-x-4">
                                                <button 
                                                    onClick={handleDownload} 
                                                    className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download Result
                                                </button>
                                            </div>
                                            <div className="mt-6 p-4 bg-white rounded-lg shadow-md border text-left max-w-2xl mx-auto dark:bg-gray-800 dark:border-gray-700">
                                                <h3 className="font-bold text-lg mb-3 text-center dark:text-gray-100">Mood Recap</h3>
                                                <div className="mb-3">
                                                    <label htmlFor="mood-title" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Project Title</label>
                                                    <input 
                                                        type="text"
                                                        id="mood-title"
                                                        value={projectTitle}
                                                        onChange={(e) => {
                                                            setProjectTitle(e.target.value)
                                                            setIsSaved(false);
                                                        }}
                                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                                        placeholder="e.g., My Dream Living Room"
                                                    />
                                                </div>
                                                <p><span className="font-semibold dark:text-white">Selected Mood:</span> {selectedMood?.name}</p>
                                                {refinementHistory.length > 0 && (
                                                    <div>
                                                        <p className="font-semibold mt-2 dark:text-white">Refinements:</p>
                                                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                                            {refinementHistory.map((r, i) => <li key={i}>{r}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {objectImages.length > 0 && (
                                                     <div>
                                                        <p className="font-semibold mt-2 dark:text-white">Added Objects:</p>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {objectImages.map((img, i) => (
                                                                <img key={i} src={`data:${img.mimeType};base64,${img.base64}`} className="h-12 w-12 object-contain rounded-md bg-gray-100 border dark:bg-gray-700 dark:border-gray-600"/>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <button onClick={handleSaveMood} disabled={isSaved} className="mt-4 w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition">
                                                    {isSaved ? 'Saved!' : 'Keep it !'}
                                                </button>
                                            </div>
                                        </>
                                    ) : <p className="text-gray-600 dark:text-gray-400">Generating your final image...</p>}
                                    <button onClick={handleRestart} className="mt-6 w-full max-w-sm mx-auto bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500">
                                        Start Over
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <footer className="text-center py-4 text-xs text-gray-500 border-t bg-gray-50 mt-auto dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400">
                    <p>
                        Made with ♥️ by <a href="https://www.linkedin.com/in/ali-hmaou-6b7b73146?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">Ali HMAOU</a>, all through AI studio apps builder.
                    </p>
                </footer>
            </div>
        </>
    );
};

export default App;