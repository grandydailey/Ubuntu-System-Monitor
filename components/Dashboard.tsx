import React, { useState, useCallback } from 'react';
import SystemHealthPanel from './SystemHealthPanel';
import LogTailPanel from './LogTailPanel';
import LogQueryPanel from './LogQueryPanel';
import ChatbotPanel from './ChatbotPanel';
import DiskPanel from './DiskPanel';
import NetworkPanel from './NetworkPanel';

const Dashboard: React.FC = () => {
  const [aiPrefillQuery, setAiPrefillQuery] = useState('');
  const [aiAutoSendQuery, setAiAutoSendQuery] = useState('');

  const formatQuery = (query: string) => `I've encountered the following system error on my Ubuntu server. Can you explain what it means, what the likely cause is, and suggest some commands to diagnose and fix it?\n\nError details:\n\`\`\`\n${query}\n\`\`\``;

  const handlePrefillAI = (query: string) => {
    setAiPrefillQuery(formatQuery(query));
  };

  const handleAutoSendAI = (query: string) => {
    setAiAutoSendQuery(formatQuery(query));
  };
  
  const handleQueryHandled = useCallback(() => setAiPrefillQuery(''), []);
  const handleQuerySent = useCallback(() => setAiAutoSendQuery(''), []);

  return (
    <div className="h-full flex flex-col p-2 md:p-4 font-mono">
      <header className="flex-shrink-0 mb-2 md:mb-4">
        <SystemHealthPanel onAskAI={handlePrefillAI} />
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 overflow-hidden">
        <div className="lg:col-span-1 h-full flex flex-col gap-2 md:gap-4 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <DiskPanel onAskAI={handleAutoSendAI} />
          </div>
          <div className="flex-1 overflow-hidden">
            <NetworkPanel />
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatbotPanel 
              initialQuery={aiPrefillQuery} 
              onQueryHandled={handleQueryHandled}
              autoSendQuery={aiAutoSendQuery}
              onQuerySent={handleQuerySent}
            />
          </div>
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogTailPanel onAskAI={handlePrefillAI} />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogQueryPanel />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;