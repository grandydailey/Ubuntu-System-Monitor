import React, { useState, useMemo } from 'react';
import Panel from './Panel';
import { SYSLOG_DATA } from '../data/mockLogs';

const LogQueryPanel: React.FC = () => {
  const [query, setQuery] = useState('');

  const filteredLogs = useMemo(() => {
    if (!query) {
      return SYSLOG_DATA.slice(-100); // Show last 100 lines by default
    }
    const lowerCaseQuery = query.toLowerCase();
    return SYSLOG_DATA.filter(line => line.toLowerCase().includes(lowerCaseQuery)).slice(-100);
  }, [query]);

  const highlightQuery = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-green-400 font-bold">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };
  
  return (
    <Panel title="grep [query] /var/log/syslog" className="flex flex-col">
      <div className="p-2 border-b border-gray-700">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query..."
          className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <div className="p-2 flex-grow overflow-y-auto">
        <pre className="text-xs whitespace-pre-wrap break-all">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((line, index) => (
              <div key={index}>{highlightQuery(line)}</div>
            ))
          ) : (
            <span className="text-gray-500">
              {query ? `No results for "${query}"` : 'Awaiting query...'}
            </span>
          )}
        </pre>
      </div>
    </Panel>
  );
};

export default LogQueryPanel;