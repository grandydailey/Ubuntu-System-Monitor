import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import SystemOverview from './components/SystemOverview';

export type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'login' | 'overview' | 'dashboard'>('login');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            root.classList.toggle('dark', mediaQuery.matches);
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleLoginSuccess = () => {
    setAppState('overview');
  };

  const handleOverviewContinue = () => {
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setAppState('login');
  };

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'overview':
        return <SystemOverview onContinue={handleOverviewContinue} />;
      case 'dashboard':
        return <Dashboard onLogout={handleLogout} theme={theme} setTheme={setTheme} />;
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="bg-background text-text-main font-sans text-sm h-screen transition-colors duration-300">
      {renderContent()}
    </div>
  );
};

export default App;