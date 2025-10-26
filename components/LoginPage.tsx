import React, { useState } from 'react';
import Panel from './Panel';

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

  // FIX: The original base64 string was corrupted, leading to multiple parsing and type errors.
  // It has been replaced with a valid placeholder (a 1x1 transparent GIF).
  const logoSrc = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-md">
        <img 
            src={logoSrc} 
            alt="Application Logo" 
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
        />
        <Panel title="Authentication Required" className="!bg-gray-900/80 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label htmlFor="username" className="block mb-2 text-cyan-400">
                Username:
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className={`w-full bg-gray-800 border rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-cyan-500'
                }`}
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading || !username}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </Panel>
         <p className="text-center text-xs text-gray-600 mt-4">
          Ubuntu System Monitor v1.0.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
