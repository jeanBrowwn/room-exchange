
import React from 'react';

interface SpinnerProps {
    message: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{message}</p>
        </div>
    );
};

export default Spinner;