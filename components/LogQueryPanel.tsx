import React, { useState, useMemo, useEffect } from 'react';
import Panel from './Panel';
import { SYSLOG_DATA } from '../data/mockLogs';

const NUM_BARS = 32; // Cava config

type Severity = 'all' | 'error' | 'warning' | 'info';

// Helper to parse log lines for filtering
const parseLogLine = (line: string): { date: Date; severity: Exclude<Severity, 'all'> } => {
    const dateMatch = line.match(/^(... \d{1,2} \d{2}:\d{2}:\d{2})/);
    // Add current year to parseable date string
    const date = dateMatch ? new Date(`${dateMatch[1]} ${new Date().getFullYear()}`) : new Date(0);

    const lowerLine = line.toLowerCase();
    let severity: Exclude<Severity, 'all'> = 'info';
    if (/\b(error|failed|denied|critical|nack)\b/.test(lowerLine)) {
        severity = 'error';
    } else if (/\b(warning|warn|above threshold|block)\b/.test(lowerLine)) {
        severity = 'warning';
    }
    
    return { date, severity };
};


const LogQueryPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<Severity>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');


  // Cava visualizer logic
  const [bars, setBars] = useState<number[]>(new Array(NUM_BARS).fill(0));
  
  const isAnyFilterActive = useMemo(() => {
    return !!query || severity !== 'all' || !!startDate || !!endDate;
  }, [query, severity, startDate, endDate]);

  useEffect(() => {
    // Only run the animation if no filters are active
    if (isAnyFilterActive) return;

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
  }, [isAnyFilterActive]); 

  const getBarColor = (height: number) => {
    if (height > 85) return 'from-red to-yellow';
    if (height > 60) return 'from-yellow to-green';
    return 'from-green to-primary';
  };
  // End Cava logic

  const filteredLogs = useMemo(() => {
    if (!isAnyFilterActive) {
      return [];
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    
    return SYSLOG_DATA.filter(line => {
        const parsed = parseLogLine(line);
        if (lowerCaseQuery && !line.toLowerCase().includes(lowerCaseQuery)) return false;
        if (severity !== 'all' && parsed.severity !== severity) return false;
        if (start && parsed.date < start) return false;
        if (end && parsed.date > end) return false;
        return true;
    }).slice(-200); // Limit results for performance
  }, [query, severity, startDate, endDate, isAnyFilterActive]);

  const highlightQuery = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-green font-bold bg-green/20">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleClear = () => {
    setQuery('');
    setSeverity('all');
    setStartDate('');
    setEndDate('');
  };

  const SeverityButton: React.FC<{ level: Severity, color: string, children: React.ReactNode }> = ({ level, color, children }) => {
    const isActive = severity === level;
    return (
      <button
        onClick={() => setSeverity(level)}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
          isActive
            ? `${color} text-black shadow`
            : 'bg-panel-header hover:bg-border text-text-secondary'
        }`}
      >
        {children}
      </button>
    );
  };
  
  return (
    <Panel title="grep [query] /var/log/syslog" className="flex flex-col">
      <div className="p-2 border-b border-border space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-grow bg-background border border-border rounded-md px-3 py-1 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary font-sans"
          />
          {isAnyFilterActive && (
            <button
              onClick={handleClear}
              className="flex-shrink-0 bg-primary/80 hover:bg-primary text-black font-bold py-1 px-3 rounded-md transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-focus font-sans"
              aria-label="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center space-x-1 p-0.5 bg-background rounded-lg">
                <SeverityButton level="all" color="bg-primary/80">All</SeverityButton>
                <SeverityButton level="error" color="bg-red">Error</SeverityButton>
                <SeverityButton level="warning" color="bg-yellow">Warning</SeverityButton>
                <SeverityButton level="info" color="bg-green">Info</SeverityButton>
            </div>
            <div className="flex items-center space-x-2 text-xs font-sans">
                <label htmlFor="start-date" className="text-text-muted">From:</label>
                <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-background border border-border rounded px-1.5 py-0.5 w-32" />
                <label htmlFor="end-date" className="text-text-muted">To:</label>
                <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-background border border-border rounded px-1.5 py-0.5 w-32" />
            </div>
        </div>
      </div>
      <div className="p-2 flex-grow overflow-y-auto text-xs font-mono text-text-secondary">
          {isAnyFilterActive ? (
            filteredLogs.length > 0 ? (
              filteredLogs.map((line, index) => (
                <div 
                  key={index} 
                  className={`whitespace-pre-wrap break-all px-2 py-0.5 rounded ${index % 2 === 0 ? 'bg-background/50' : ''}`}
                >
                  {highlightQuery(line)}
                </div>
              ))
            ) : (
              <span className="text-text-muted px-2 font-sans">
                No results found for the current filters.
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