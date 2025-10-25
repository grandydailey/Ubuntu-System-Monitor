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

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'overview':
        return <SystemOverview onContinue={handleOverviewContinue} />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="bg-black text-gray-300 font-mono text-sm h-screen">
      {renderContent()}
    </div>
  );
};

export default App;
