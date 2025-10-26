import React, { useState, useMemo, useEffect } from 'react';
import Panel from './Panel';
import { SYSLOG_DATA } from '../data/mockLogs';

const NUM_BARS = 32; // Cava config

const LogQueryPanel: React.FC = () => {
  const [query, setQuery] = useState('');

  // Cava visualizer logic
  const [bars, setBars] = useState<number[]>(new Array(NUM_BARS).fill(0));

  useEffect(() => {
    // Only run the animation if the query is empty
    if (query) return;

    const interval = setInterval(() => {
      setBars(prevBars => {
        return prevBars.map(bar => {
          const randomChange = (Math.random() - 0.4) * 25;
          const newHeight = Math.max(0, Math.min(100, bar + randomChange));
          return newHeight;
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [query]); // Effect depends on query to start/stop the animation

  const getBarColor = (height: number) => {
    if (height > 85) return 'from-red-500 to-yellow-500';
    if (height > 60) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-cyan-500';
  };
  // End Cava logic

  const filteredLogs = useMemo(() => {
    if (!query) {
      return []; // No results when query is empty
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
    <Panel title="grep [query] /var/log/syslog" className="flex flex-col !bg-gray-900/50 backdrop-blur-sm">
      <div className="p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1 px-3 rounded-md transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="Clear query results"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>
      <div className="p-2 flex-grow overflow-y-auto text-xs">
          {query ? (
            filteredLogs.length > 0 ? (
              filteredLogs.map((line, index) => (
                <div 
                  key={index} 
                  className={`whitespace-pre-wrap break-all px-2 py-0.5 rounded ${index % 2 === 0 ? 'bg-gray-800/50' : ''}`}
                >
                  {highlightQuery(line)}
                </div>
              ))
            ) : (
              <span className="text-gray-500 px-2">
                {`No results for "${query}"`}
              </span>
            )
          ) : (
            <div className="h-full flex items-end justify-center space-x-1 overflow-hidden">
              {bars.map((height, index) => (
                <div
                  key={index}
                  className={`w-full rounded-t-sm transition-all duration-100 ease-linear bg-gradient-to-t ${getBarColor(height)}`}
                  style={{ 
                    height: `${height}%`,
                  }}
                />
              ))}
            </div>
          )}
      </div>
    </Panel>
  );
};

export default LogQueryPanel;