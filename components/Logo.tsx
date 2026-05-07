"use client";

import React, { useState } from "react";

interface LogoProps {
    className?: string; // Allows customizing the height/width of the logo wrapper
}

export default function Logo({ className = "h-8" }: LogoProps) {
    const [hasError, setHasError] = useState(false);

    return (
        <div className={`logo-glass-tab ${className}`}>
            {!hasError ? (
                <img
                    src="/logo.png"
                    alt="PrepWise Logo"
                    className="h-full object-contain"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="#e8985a" strokeWidth="2.5" fill="none" />
                        <circle cx="12" cy="16" r="3" fill="#e8985a" />
                        <path d="M18 13 C22 13 22 19 18 19" stroke="#e8985a" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M20 11 C25 11 25 21 20 21" stroke="#e8985a" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    </svg>
                    <span className="text-lg font-bold tracking-wide text-white">
                        PrepWise
                    </span>
                </div>
            )}
        </div>
    );
}
