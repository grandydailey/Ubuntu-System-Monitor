import React, { useState } from 'react';
import SystemHealthPanel from './SystemHealthPanel';
import LogTailPanel from './LogTailPanel';
import LogQueryPanel from './LogQueryPanel';
import ChatbotPanel from './ChatbotPanel';
import DiskPanel from './DiskPanel';
import NetworkPanel from './NetworkPanel';

const Dashboard: React.FC = () => {
  const [aiQuery, setAiQuery] = useState('');

  const handleAskAI = (query: string) => {
    const fullQuery = `I've encountered the following system error on my Ubuntu server. Can you explain what it means, what the likely cause is, and suggest some commands to diagnose and fix it?\n\nError details:\n\`\`\`\n${query}\n\`\`\``;
    setAiQuery(fullQuery);
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-4">
      <header className="flex-shrink-0 mb-2 md:mb-4">
        <SystemHealthPanel onAskAI={handleAskAI} />
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 overflow-hidden">
        <div className="lg:col-span-1 h-full flex flex-col gap-2 md:gap-4 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <DiskPanel />
          </div>
          <div className="flex-1 overflow-hidden">
            <NetworkPanel />
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatbotPanel initialQuery={aiQuery} onQueryHandled={() => setAiQuery('')} />
          </div>
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogTailPanel />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogQueryPanel />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;