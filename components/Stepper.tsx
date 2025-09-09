import React from 'react';

interface StepperProps {
    steps: string[];
    activeStepIndex: number;
    onStepClick: (index: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStepIndex, onStepClick }) => {
    return (
        <nav className="flex items-center justify-center mb-8" aria-label="Progress">
            <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
                {steps.map((stepName, index) => (
                    <li key={stepName} className="flex items-center">
                        {index > 0 && (
                            <svg className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                        )}
                        <button
                            onClick={() => onStepClick(index)}
                            disabled={index > activeStepIndex}
                            className={`flex items-center text-sm font-medium transition-colors duration-200 ${
                                index === activeStepIndex
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : index < activeStepIndex
                                    ? 'text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400'
                                    : 'text-gray-400 cursor-not-allowed dark:text-gray-500'
                            }`}
                            aria-current={index === activeStepIndex ? 'step' : undefined}
                        >
                            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                index === activeStepIndex
                                    ? 'border-indigo-600 dark:border-indigo-400'
                                    : index < activeStepIndex
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-gray-300 dark:border-gray-600'
                            } mr-2 sm:mr-4`}>
                                {index < activeStepIndex ? (
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <span className="font-bold">{index + 1}</span>
                                )}
                            </span>
                            <span className="hidden sm:inline">{stepName}</span>
                        </button>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Stepper;