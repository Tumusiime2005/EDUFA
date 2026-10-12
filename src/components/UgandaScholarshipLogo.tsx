import React, { useState } from 'react';
import scholarshipLogo from '../assets/images/uganda_scholarship_logo_1791827481064.jpg';

interface UgandaScholarshipLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

export const UgandaScholarshipLogo: React.FC<UgandaScholarshipLogoProps> = ({
  className = '',
  size = 'md',
  showBorder = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size];

  if (hasError) {
    // High fidelity SVG fallback embodying the exact emblem:
    // Ugandan flag border (black, yellow, red, green base), rising sun, scales of justice, open book, golden path
    return (
      <svg
        viewBox="0 0 200 200"
        className={`${sizeClasses} shrink-0 ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Uganda Scholarship Fairness Logo"
      >
        <circle cx="100" cy="100" r="96" fill="#ffffff" />
        
        {/* Uganda Color Outer Rings */}
        <path d="M 24 100 A 76 76 0 0 1 100 24" stroke="#000000" strokeWidth="12" strokeLinecap="round" />
        <path d="M 100 24 A 76 76 0 0 1 176 100" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />
        <path d="M 176 100 A 76 76 0 0 1 100 176" stroke="#DC2626" strokeWidth="12" strokeLinecap="round" />
        <path d="M 100 176 A 76 76 0 0 1 24 100" stroke="#000000" strokeWidth="12" strokeLinecap="round" />
        {/* Green accent at bottom */}
        <polygon points="100,185 85,165 115,165" fill="#15803D" />

        {/* Rising Sun */}
        <circle cx="100" cy="70" r="28" fill="#FBBF24" />
        <path d="M 100 35 L 100 45 M 75 42 L 82 50 M 125 42 L 118 50 M 60 60 L 70 65 M 140 60 L 130 65" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

        {/* Scales of Justice */}
        <rect x="97" y="55" width="6" height="45" fill="#1E293B" rx="3" />
        <path d="M 60 72 L 140 72" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
        <circle cx="100" cy="72" r="5" fill="#1E293B" />
        
        {/* Left Pan */}
        <path d="M 60 72 L 48 95 M 60 72 L 72 95" stroke="#1E293B" strokeWidth="2" />
        <path d="M 45 95 Q 60 108 75 95 Z" fill="#1E293B" />
        
        {/* Right Pan */}
        <path d="M 140 72 L 128 95 M 140 72 L 152 95" stroke="#1E293B" strokeWidth="2" />
        <path d="M 125 95 Q 140 108 155 95 Z" fill="#1E293B" />

        {/* Golden Path */}
        <path d="M 100 96 C 88 112 112 126 100 145" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" fill="none" />

        {/* Open Book */}
        <path d="M 40 145 Q 100 135 100 152 Q 100 135 160 145 L 155 162 Q 100 152 100 168 Q 100 152 45 162 Z" fill="#0F172A" />
        <path d="M 45 142 Q 100 132 100 148 Q 100 132 155 142 L 152 156 Q 100 146 100 162 Q 100 146 48 156 Z" fill="#FBBF24" />
      </svg>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-white shadow-md transition-transform duration-200 ${
        showBorder ? 'ring-2 ring-amber-500/30' : ''
      } ${sizeClasses} ${className}`}
    >
      <img
        src={scholarshipLogo || '/logo.png'}
        alt="Uganda Scholarship Fairness Emblem"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};
