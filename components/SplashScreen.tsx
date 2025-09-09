import React from 'react';
import Logo from './Logo';

interface SplashScreenProps {
    isFinishing: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isFinishing }) => {
    return (
        <div className={`fixed inset-0 bg-gray-50 z-50 flex items-center justify-center transition-opacity duration-500 ${isFinishing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="animate-pulse">
                <Logo className="h-16 w-auto" />
            </div>
        </div>
    );
};

export default SplashScreen;
