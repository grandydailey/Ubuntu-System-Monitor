import React, { useState, useCallback } from 'react';
import SystemHealthPanel from './SystemHealthPanel';
import LogTailPanel from './LogTailPanel';
import TerminalPanel from './TerminalPanel';
import ChatbotPanel from './ChatbotPanel';
import HardwareAndServicesPanel from './DiskPanel';
import LogQueryPanel from './LogQueryPanel';
import { TerminalIcon, ChatIcon, LogoutIcon } from './icons';

interface DashboardProps {
    onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [aiPrefillQuery, setAiPrefillQuery] = useState('');
  const [aiAutoSendQuery, setAiAutoSendQuery] = useState('');

  const formatQuery = (query: string) => `I've encountered the following system error on my Ubuntu server. Can you explain what it means, what the likely cause is, and suggest some commands to diagnose and fix it?\n\nError details:\n\`\`\`\n${query}\n\`\`\``;

  const handlePrefillAI = useCallback((query: string) => {
    setAiPrefillQuery(formatQuery(query));
    setShowChatbot(true);
  }, []);

  const handleAutoSendAI = useCallback((query: string) => {
    setAiAutoSendQuery(formatQuery(query));
    setShowChatbot(true);
  }, []);
  
  const handleQueryHandled = useCallback(() => setAiPrefillQuery(''), []);
  const handleQuerySent = useCallback(() => setAiAutoSendQuery(''), []);

  const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; maxWidthClass: string }> = ({ children, onClose, maxWidthClass }) => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-2 sm:p-4" onClick={onClose}>
        <div className={`w-full h-full ${maxWidthClass} max-h-[95vh] sm:max-h-[90vh] shadow-2xl rounded-lg overflow-hidden`} onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
  );
  
  const ActionButton: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button 
      onClick={onClick} 
      className="bg-panel-bg border border-border hover:bg-border text-text-secondary px-3 py-2 rounded-md flex items-center justify-center sm:justify-start space-x-2 transition-colors w-full sm:w-auto"
    >
        {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-2 md:p-4 font-mono">
      <header className="flex-shrink-0 mb-2 md:mb-4 flex flex-col sm:flex-row items-stretch sm:items-start gap-2 md:gap-4">
        <div className="flex-grow">
          <SystemHealthPanel onAskAI={handlePrefillAI} />
        </div>
        <div className="flex sm:flex-col gap-2 md:gap-4">
            <ActionButton onClick={() => setShowTerminal(p => !p)}>
                <TerminalIcon /> <span className="">Terminal</span>
            </ActionButton>
            <ActionButton onClick={() => setShowChatbot(p => !p)}>
                <ChatIcon /> <span className="">AI Assistant</span>
            </ActionButton>
            {onLogout && (
                <ActionButton onClick={onLogout}>
                    <LogoutIcon /> <span>Logout</span>
                </ActionButton>
            )}
        </div>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 overflow-hidden">
        <div className="lg:col-span-1 h-full overflow-hidden">
          <LogTailPanel onAskAI={handlePrefillAI} />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
           <LogQueryPanel />
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden">
          <HardwareAndServicesPanel onAskAI={handleAutoSendAI} />
        </div>
      </main>

      {showTerminal && (
        <Modal onClose={() => setShowTerminal(false)} maxWidthClass="max-w-6xl">
          <TerminalPanel />
        </Modal>
      )}

      {showChatbot && (
        <Modal onClose={() => setShowChatbot(false)} maxWidthClass="max-w-2xl">
          <ChatbotPanel 
            initialQuery={aiPrefillQuery} 
            onQueryHandled={handleQueryHandled}
            autoSendQuery={aiAutoSendQuery}
            onQuerySent={handleQuerySent}
          />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
