import React from 'react';
import type { Theme } from '../App';
import { SunIcon, MoonIcon, MonitorIcon } from './icons';

interface ThemeToggleButtonProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ theme, setTheme }) => {
  const themes: { name: Theme; icon: React.ReactNode }[] = [
    { name: 'light', icon: <SunIcon /> },
    { name: 'dark', icon: <MoonIcon /> },
    { name: 'system', icon: <MonitorIcon /> },
  ];

  return (
    <div className="flex bg-panel-header p-1 rounded-md">
      {themes.map(({ name, icon }) => (
        <button
          key={name}
          onClick={() => setTheme(name)}
          className={`px-3 py-1.5 rounded-md transition-colors text-sm flex items-center justify-center space-x-2 w-full ${
            theme === name
              ? 'bg-primary text-text-inverted shadow'
              : 'text-text-secondary hover:bg-border'
          }`}
          aria-label={`Switch to ${name} theme`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggleButton;
