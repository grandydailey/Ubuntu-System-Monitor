import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import SystemOverview from './components/SystemOverview';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'login' | 'overview' | 'dashboard'>('login');

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
        return <Dashboard onLogout={handleLogout} />;
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="bg-background text-text-main font-sans text-sm h-screen">
      {renderContent()}
    </div>
  );
};

export default App;
