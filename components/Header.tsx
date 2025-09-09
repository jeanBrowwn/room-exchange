import React from 'react';
import Logo from './Logo';

interface HeaderProps {
    onMenuClick: () => void;
    showMenuButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md shadow-sm z-20 border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
            <div className="container mx-auto px-4 md:px-8 h-full flex items-center relative">
                {/* Left side: Menu Button */}
                <div>
                    {showMenuButton && (
                        <button onClick={onMenuClick} className="p-2 rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100" aria-label="Open menu">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="sr-only">Open Menu</span>
                        </button>
                    )}
                </div>

                {/* Center: Logo (absolutely positioned for perfect centering) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                     <Logo className="h-10 w-auto" />
                </div>
            </div>
        </header>
    );
};

export default Header;