import React, { useState } from 'react';
import Panel from './Panel';
import { LogoIcon } from './icons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (username === 'namour') {
        onLoginSuccess();
      } else {
        setError('Access Denied.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <LogoIcon className="w-24 h-24 rounded-full shadow-lg"/>
        </div>
        <Panel title="Authentication Required" className="!bg-panel-bg/80 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label htmlFor="username" className="block mb-2 text-primary font-mono">
                Username:
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className={`w-full bg-background border rounded-md px-3 py-2 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 font-mono ${
                  error
                    ? 'border-red focus:ring-red'
                    : 'border-border focus:ring-primary'
                }`}
              />
              {error && <p className="mt-2 text-sm text-red font-mono">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading || !username}
              className="w-full bg-primary hover:bg-primary-focus text-black font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </Panel>
         <p className="text-center text-xs text-text-muted mt-4 font-mono">
          Namour System Monitor v2.0.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;