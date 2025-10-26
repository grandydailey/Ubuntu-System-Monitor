import React from 'react';
import type { GroupedError } from '../types';
import { SparklesIcon } from './icons';

interface ErrorModalProps {
  isOpen: boolean;
  errors: GroupedError[];
  onClose: () => void;
  onAskAI?: (query: string) => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, errors, onClose, onAskAI }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-panel-bg border border-red rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold text-red">System Errors Detected</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4">
          <div className="bg-background p-3 rounded-md max-h-80 overflow-y-auto font-mono">
            <ul className="space-y-3 text-sm">
              {errors.map((error, index) => {
                const isApache = error.message.startsWith('APACHE:');
                const isSyslog = error.message.startsWith('SYSLOG:');
                const prefix = isApache ? 'APACHE:' : isSyslog ? 'SYSLOG:' : '';
                const message = error.message.substring(prefix.length).trim();

                return (
                  <li key={index} className="text-yellow">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <span className="text-text-muted mr-2">{`[${error.firstTimestamp}]`}</span>
                        {prefix && <span className={`font-bold mr-2 ${isApache ? 'text-orange-400' : 'text-primary'}`}>{prefix}</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {error.count > 1 && (
                          <span className="text-xs bg-red/50 text-red rounded-full px-2 py-0.5">
                            {error.count} times
                          </span>
                        )}
                        {onAskAI && (
                          <button
                            onClick={() => {
                              onAskAI(error.message);
                              onClose();
                            }}
                            className="p-1.5 text-primary hover:bg-primary/20 rounded-full transition-colors"
                            title="Ask AI about this error"
                          >
                            <SparklesIcon />
                          </button>
                        )}
                      </div>
                    </div>
                    <code className="block bg-black/20 p-2 rounded mt-1 text-xs whitespace-pre-wrap">
                      {message}
                    </code>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="p-4 border-t border-border text-right">
          <button 
            onClick={onClose} 
            className="bg-red/80 hover:bg-red text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;