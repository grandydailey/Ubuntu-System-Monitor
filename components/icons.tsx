import React from 'react';

const iconProps = {
  className: "w-5 h-5 text-cyan-400",
  strokeWidth: 1.5,
};

export const TemperatureIcon: React.FC = () => (
  <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

export const MemoryIcon: React.FC = () => (
  <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
    <path d="M6 12h4m4 0h4" />
  </svg>
);

export const DiskIcon: React.FC = () => (
  <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 5v14a9 3 0 0 1-18 0V5" />
    <path d="M3 5a9 3 0 0 1 18 0" />
  </svg>
);

export const FailingDiskIcon: React.FC = () => (
    <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-red-400">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 5v14a9 3 0 0 1-18 0V5" />
        <path d="M3 5a9 3 0 0 1 18 0" />
        <path d="m9 12 6 6" strokeWidth="2" strokeLinecap="round" />
        <path d="m15 12-6 6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const WifiIcon: React.FC = () => (
  <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

export const CpuIcon: React.FC = () => (
  <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </svg>
);

export const ServerIcon: React.FC = () => (
  <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
    <line x1="6" y1="6" x2="6.01" y2="6"></line>
    <line x1="6" y1="18" x2="6.01" y2="18"></line>
  </svg>
);

export const OsIcon: React.FC = () => (
    <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
);

export const AlertTriangleIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export const ArrowUpIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

export const ArrowDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14m-7-7l7 7 7-7" />
    </svg>
);

export const SpeakerOnIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

export const SpeakerOffIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);
