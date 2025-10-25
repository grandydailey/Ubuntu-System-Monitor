import React from 'react';
import SystemHealthPanel from './components/SystemHealthPanel';
import LogTailPanel from './components/LogTailPanel';
import LogQueryPanel from './components/LogQueryPanel';
import CavaPanel from './components/CavaPanel';

const App: React.FC = () => {
  return (
    <div className="bg-black text-gray-300 font-mono text-sm h-screen flex flex-col p-2 md:p-4">
      <header className="flex-shrink-0 mb-2 md:mb-4">
        <SystemHealthPanel />
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 overflow-hidden">
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogTailPanel />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogQueryPanel />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <CavaPanel />
        </div>
      </main>
    </div>
  );
};

export default App;