import React, { useState } from 'react';
import { UploadedFile, SavedMood } from '../types';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentUpload: UploadedFile | null;
    savedMoods: SavedMood[];
    onLoadMood: (moodId: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, currentUpload, savedMoods, onLoadMood }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            ></div>

            {/* Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out dark:bg-gray-900 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">My Moods</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full dark:text-gray-400 dark:hover:text-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-6 pb-4">
                        {/* Current Session */}
                        {currentUpload && (
                             <div>
                                <h3 className="font-semibold text-gray-500 border-b pb-2 mb-3 dark:text-gray-400 dark:border-gray-700">Current Session</h3>
                                <div className="p-2 border rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                    <p className="text-sm font-medium text-gray-600 mb-2 dark:text-gray-300">Original Space</p>
                                     <img
                                        src={`data:${currentUpload.mimeType};base64,${currentUpload.base64}`}
                                        alt="Original room for current session"
                                        className="w-full h-auto rounded-md"
                                    />
                                </div>
                            </div>
                        )}
                       
                        {/* Saved Moods */}
                        <div>
                             <h3 className="font-semibold text-gray-500 border-b pb-2 mb-3 dark:text-gray-400 dark:border-gray-700">Saved Moods</h3>
                             {savedMoods.length > 0 ? (
                                <div className="space-y-4">
                                    {savedMoods.map(mood => (
                                        <button 
                                            key={mood.id} 
                                            onClick={() => onLoadMood(mood.id)}
                                            className="w-full flex items-center space-x-4 p-2 rounded-lg hover:bg-indigo-50 transition-colors text-left dark:hover:bg-gray-800"
                                        >
                                            <img src={mood.finalImage} alt={mood.title} className="w-20 h-20 rounded-md object-cover flex-shrink-0 bg-gray-200" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-800 dark:text-gray-100">{mood.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{mood.moodName}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                             ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">You haven't saved any moods yet.</p>
                                    <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">Complete a design and click "Keep it!" to save it here.</p>
                                </div>
                             )}
                        </div>
                        
                        {/* Technical Sections */}
                        <div className="space-y-6">
                             <div>
                                <h3 className="font-semibold text-gray-500 border-b pb-2 mb-3 dark:text-gray-400 dark:border-gray-700">How It Works</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This app uses a multi-step process powered by Gemini. First, it analyzes your room to understand its layout. Then, it generates textual mood descriptions and corresponding images. You can then refine the mood with text prompts and even add your own objects, which are seamlessly integrated into the final image.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-500 border-b pb-2 mb-3 dark:text-gray-400 dark:border-gray-700">LLM Configuration</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="mood-gen-llm" className="text-gray-700 dark:text-gray-300">Mood Generation:</label>
                                        <select id="mood-gen-llm" disabled className="p-1 border rounded-md bg-gray-100 text-gray-500 w-1/2 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                                            <option>gemini-2.5-flash</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="img-gen-llm" className="text-gray-700 dark:text-gray-300">Image Generation:</label>
                                        <select id="img-gen-llm" disabled className="p-1 border rounded-md bg-gray-100 text-gray-500 w-1/2 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                                            <option>gemini-2.5-flash-image-preview</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-500 border-b pb-2 mb-3 dark:text-gray-400 dark:border-gray-700">Hackathon Submission</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    This App was built as a submission for the <a href="https://www.kaggle.com/competitions/banana" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">Nano Banana Hackathon</a> by Google and posted by Kaggle (What a team up !).
                                </p>
                                <button onClick={() => setIsModalOpen(true)} className="w-full p-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition">
                                    Hackathon submission video
                                </button>
                            </div>
                        </div>

                    </div>
                    <div className="flex-shrink-0 pt-4 mt-auto border-t dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                        <p>
                            Made with ♥️ by <a href="https://www.linkedin.com/in/ali-hmaou-6b7b73146?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">Ali HMAOU</a>
                        </p>
                        <p>all through AI studio apps builder</p>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {isModalOpen && (
                <div 
                    onClick={() => setIsModalOpen(false)}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black p-1 rounded-lg shadow-xl relative max-w-3xl w-full"
                    >
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full p-1 shadow-lg z-10 leading-none hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            aria-label="Close video"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe 
                                className="w-full h-full rounded-md"
                                src="https://www.youtube.com/embed/kw7D4J3ONxc?autoplay=1" 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                referrerPolicy="strict-origin-when-cross-origin" 
                                allowFullScreen>
                            </iframe>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SidePanel;