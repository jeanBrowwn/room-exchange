import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = 'h-10 w-auto' }) => {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
             <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-full">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: 'rgb(79, 70, 229)', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor: 'rgb(129, 140, 248)', stopOpacity:1}} />
                    </linearGradient>
                </defs>
                <path 
                    d="M50,5 A25,25 0,0,1 75,30 C75,50 50,70 50,70 C50,70 25,50 25,30 A25,25 0,0,1 50,5 Z"
                    fill="url(#grad1)"
                    transform="rotate(45 50 50)"
                />
                 <path 
                    d="M50 70 C 50 70, 75 90, 60 95 C 45 100, 50 70, 50 70Z"
                    fill="#34d399"
                    transform="rotate(45 50 50)"
                />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                Vibe <span className="text-indigo-600">Mooding</span>
            </span>
        </div>
    );
};

export default Logo;