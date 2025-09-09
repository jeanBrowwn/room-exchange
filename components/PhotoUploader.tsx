
import React, { useState, useRef } from 'react';

interface PhotoUploaderProps {
    onPhotoUpload: (file: File) => void;
    disabled: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoUpload, disabled }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onPhotoUpload(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full p-6 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col items-center dark:bg-gray-800 dark:border-gray-700">
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                disabled={disabled}
            />
            {preview ? (
                <div className="w-full text-center">
                    <img src={preview} alt="Room preview" className="max-h-80 w-auto mx-auto rounded-md shadow-md" />
                    <button
                        onClick={handleUploadClick}
                        disabled={disabled}
                        className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition duration-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        Change Photo
                    </button>
                </div>
            ) : (
                <div 
                    onClick={handleUploadClick}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition duration-200 dark:border-gray-600 dark:hover:border-indigo-500 dark:hover:bg-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Click to upload a photo of your room</p>
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;