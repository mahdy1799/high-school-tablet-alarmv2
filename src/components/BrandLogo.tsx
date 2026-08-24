import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTagline?: boolean;
  className?: string;
  isDark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  isDark = true,
}) => {
  const iconSize = size === 'sm' ? 36 : size === 'md' ? 52 : size === 'lg' ? 76 : 110;
  const titleSize =
    size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-4xl';
  const tagSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`} id="brand-logo-container">
      {/* Visual Vector Icon */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: iconSize, height: iconSize * 1.12 }}
      >
        <svg
          viewBox="0 0 120 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Definitions & Gradients */}
          <defs>
            <linearGradient id="clockFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FE7D04" />
              <stop offset="100%" stopColor="#FF9E42" />
            </linearGradient>
            <linearGradient id="tabletGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06143D" />
              <stop offset="100%" stopColor="#003068" />
            </linearGradient>
          </defs>

          {/* Tablet Outer Body */}
          <rect
            x="8"
            y="4"
            width="104"
            height="132"
            rx="18"
            fill="url(#tabletGrad)"
            stroke="#06143D"
            strokeWidth="3"
          />

          {/* Camera Dot & Home Pill */}
          <circle cx="60" cy="11" r="2" fill="#5B6472" />
          <circle cx="60" cy="128" r="4.5" fill="#FFFFFF" fillOpacity="0.9" />

          {/* Tablet Inner White Screen */}
          <rect x="15" y="18" width="90" height="102" rx="10" fill="#FFFFFF" />

          {/* Sound Waves / Signal Swoosh top-right */}
          <path
            d="M 86 32 C 92 36 94 44 91 50"
            stroke="#FE7D04"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 80 37 C 84 40 85 46 83 50"
            stroke="#FE7D04"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Alarm Clock Top Bells */}
          <path d="M 33 46 C 30 38 41 32 46 40 Z" fill="#06143D" />
          <path d="M 87 46 C 90 38 79 32 74 40 Z" fill="#06143D" />
          <rect x="56" y="32" width="8" height="6" rx="2" fill="#06143D" />

          {/* Alarm Clock Circular Outer Rim */}
          <circle cx="60" cy="58" r="26" fill="#06143D" />

          {/* Alarm Clock Gradient Ring */}
          <circle cx="60" cy="58" r="21" fill="#FFFFFF" />
          <circle cx="60" cy="58" r="17.5" fill="url(#clockFaceGrad)" />
          <circle cx="60" cy="58" r="14" fill="#FFFFFF" />

          {/* Clock Hands at 06:00 */}
          <line
            x1="60"
            y1="58"
            x2="60"
            y2="49"
            stroke="#06143D"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="60"
            y1="58"
            x2="67"
            y2="58"
            stroke="#06143D"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="60" cy="58" r="2.5" fill="#FE7D04" />

          {/* Open Study Book at bottom */}
          <path
            d="M 23 104 C 36 97 50 99 60 102 C 70 99 84 97 97 104 L 97 114 C 84 107 70 109 60 112 C 50 109 36 107 23 114 Z"
            fill="#06143D"
          />
          <path
            d="M 27 100 C 38 95 49 97 60 99 C 71 97 82 95 93 100 L 93 104 C 82 99 71 101 60 103 C 49 101 38 99 27 104 Z"
            fill="#003068"
            fillOpacity="0.4"
          />

          {/* Graduation Cap / Mortarboard */}
          <polygon points="60,78 86,88 60,98 34,88" fill="#06143D" />
          {/* Cap Lower Base */}
          <path d="M 44 92 L 44 98 C 44 104 76 104 76 98 L 76 92 Z" fill="#003068" />
          {/* Tassel */}
          <path d="M 60 88 L 79 92 L 80 99" stroke="#FE7D04" strokeWidth="2" strokeLinecap="round" />
          <circle cx="80" cy="100" r="1.5" fill="#FE7D04" />
        </svg>
      </div>

      {/* Typography Wordmark with Bold Typography styling */}
      <div className="flex flex-col">
        <div className={`font-black leading-none tracking-tighter ${titleSize} font-cairo flex items-baseline gap-1.5`}>
          <span className={isDark ? 'text-[#F5F5F5]' : 'text-[#0A0A0A]'}>منبه</span>
          <span className="text-[#FACC15]">تابلت</span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-[1.5px] bg-[#FACC15]" />
            <span
              className={`font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              THANAWEYA // 2026
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
