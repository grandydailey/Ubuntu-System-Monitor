import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Panel from './Panel';
import { AUTH_LOG_SAMPLE, APACHE_LOG_SAMPLE, FAIL2BAN_LOG_SAMPLE, MYSQL_LOG_SAMPLE } from '../data/mockLogs';
import { SpeakerOnIcon, SpeakerOffIcon, PauseIcon, PlayIcon, SparklesIcon, FileIcon } from './icons';

type LogSource = 'auth' | 'apache' | 'fail2ban' | 'mysql';
type LogSeverity = 'all' | 'info' | 'warning' | 'error' | 'critical';
type LogLine = {
  text: string;
  type: Omit<LogSeverity, 'all'>;
};

interface LogTailPanelProps {
    onAskAI?: (query: string) => void;
}

const logSources: { id: LogSource; label: string; path: string }[] = [
    { id: 'auth', label: 'auth.log', path: '/var/log/' },
    { id: 'apache', label: 'access.log', path: '/var/log/apache2/' },
    { id: 'fail2ban', label: 'fail2ban.log', path: '/var/log/' },
    { id: 'mysql', label: 'mysql.log', path: '/var/log/' },
];

const LogTailPanel: React.FC<LogTailPanelProps> = ({ onAskAI }) => {
  const [activeLog, setActiveLog] = useState<LogSource | null>(null);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<LogSeverity>('all');
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlertSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
  
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
  
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(900, context.currentTime); // High-pitched alert
    gainNode.gain.setValueAtTime(0.05, context.currentTime); // Keep volume low
  
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1); // 100ms beep
  }, [isMuted]);

  const playIntrusionAlertSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
  
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.08, context.currentTime);
  
    // Create a siren-like effect
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(660, context.currentTime + 0.15);
    oscillator.frequency.linearRampToValueAtTime(440, context.currentTime + 0.3);
  
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  }, [isMuted]);

  useEffect(() => {
    if (activeLog) {
      setLogLines([]);
      setIsPaused(false);
      setFilter('all');
    }
  }, [activeLog]);

  useEffect(() => {
    if (!activeLog || isPaused) return;

    const interval = window.setInterval(() => {
      let source;
      switch(activeLog) {
        case 'auth': source = AUTH_LOG_SAMPLE; break;
        case 'apache': source = APACHE_LOG_SAMPLE; break;
        case 'fail2ban': source = FAIL2BAN_LOG_SAMPLE; break;
        case 'mysql': source = MYSQL_LOG_SAMPLE; break;
        default: source = [];
      }
      const newLineText = source[Math.floor(Math.random() * source.length)];
      
      const lowerLine = newLineText.toLowerCase();
      
      let lineType: Omit<LogSeverity, 'all'> = 'info';

      if (activeLog === 'auth') {
        if (lowerLine.includes('sshd') && lowerLine.includes('failed password')) {
            lineType = 'critical';
            playIntrusionAlertSound();
        } else if (lowerLine.includes('failed')) {
            lineType = 'error';
            playAlertSound();
        }
      } else if (activeLog === 'apache') {
          if (/"\s5\d{2}\s/.test(newLineText)) { // Server errors (5xx)
              lineType = 'error';
              playAlertSound();
          } else if (/"\s4\d{2}\s/.test(newLineText)) { // Client errors (4xx)
              lineType = 'warning';
          }
      } else if (activeLog === 'fail2ban') {
          if (lowerLine.includes(' ban ') || lowerLine.includes('jail')) {
              lineType = 'critical';
              playIntrusionAlertSound();
          } else if (lowerLine.includes('error')) {
              lineType = 'error';
              playAlertSound();
          } else if (lowerLine.includes('unban') || lowerLine.includes('found')) {
              lineType = 'warning';
          }
      } else if (activeLog === 'mysql') {
        if (lowerLine.includes('[error]')) {
            lineType = 'error';
            playAlertSound();
        } else if (lowerLine.includes('[warning]')) {
            lineType = 'warning';
        }
      }

      const newLine: LogLine = { text: newLineText, type: lineType };

      setLogLines(prevLines => {
        const updatedLines = [...prevLines, newLine];
        if (updatedLines.length > 100) {
          return updatedLines.slice(updatedLines.length - 100);
        }
        return updatedLines;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [activeLog, isPaused, playAlertSound, playIntrusionAlertSound]);

  const handleSelectLog = (source: LogSource) => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
      }
    }
    setActiveLog(source);
  };

  const filteredLogLines = useMemo(() => {
    if (filter === 'all') return logLines;
    return logLines.filter(line => {
      if (filter === 'info') return line.type === 'info';
      if (filter === 'warning') return line.type === 'warning';
      if (filter === 'error') return line.type === 'error' || line.type === 'critical';
      return true;
    });
  }, [logLines, filter]);
  
  const SeverityButton: React.FC<{ level: LogSeverity, color: string, children: React.ReactNode }> = ({ level, color, children }) => {
    const isActive = filter === level;
    return (
      <button
        onClick={() => setFilter(level)}
        className={`px-3 py-1 text-xs font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${
          isActive
            ? `${color} text-black shadow`
            : 'bg-background hover:bg-border text-text-secondary'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <Panel title="tail -f [log_file]" className="flex flex-col">
      <div className="flex flex-grow overflow-hidden">
        {/* Log selection sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-border p-2 space-y-1 overflow-y-auto">
            <p className="text-xs font-bold text-text-muted px-2 pb-1">LOG FILES</p>
            {logSources.map(source => (
                <button
                    key={source.id}
                    onClick={() => handleSelectLog(source.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md flex items-center space-x-2 text-sm transition-colors duration-150 ${
                        activeLog === source.id
                        ? 'bg-primary/20 text-primary font-bold'
                        : 'text-text-secondary hover:bg-border hover:text-text-main'
                    }`}
                >
                    <FileIcon className="w-4 h-4 flex-shrink-0"/>
                    <div className="truncate">
                        <span className="block truncate">{source.label}</span>
                        <span className="text-xs text-text-muted block truncate">{source.path}</span>
                    </div>
                </button>
            ))}
        </div>

        {/* Main log content area */}
        <div className="flex flex-col flex-grow overflow-hidden">
            <div className="p-2 border-b border-border flex justify-between items-center flex-wrap gap-2">
                 {activeLog ? (
                    <div className="flex items-center space-x-1 p-0.5 bg-panel-header rounded-lg">
                        <SeverityButton level="all" color="bg-primary/80">All</SeverityButton>
                        <SeverityButton level="error" color="bg-red">Error</SeverityButton>
                        <SeverityButton level="warning" color="bg-yellow">Warning</SeverityButton>
                        <SeverityButton level="info" color="bg-green">Info</SeverityButton>
                    </div>
                ) : <div />}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        disabled={!activeLog}
                        className={`p-2 rounded-md transition-colors duration-200 bg-panel-header hover:bg-border ${isPaused ? 'text-green' : 'text-yellow'} disabled:text-text-muted disabled:bg-background disabled:cursor-not-allowed`}
                        aria-label={isPaused ? 'Resume log tailing' : 'Pause log tailing'}
                    >
                        {isPaused ? <PlayIcon /> : <PauseIcon />}
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded-md transition-colors duration-200 bg-panel-header hover:bg-border ${isMuted ? 'text-text-muted' : 'text-primary'}`}
                        aria-label={isMuted ? 'Unmute alerts' : 'Mute alerts'}
                    >
                        {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
                    </button>
                </div>
            </div>
            <div className="p-2 flex-grow overflow-y-auto text-xs font-mono">
                {logLines.length > 0
                ? filteredLogLines.map((line, index) => {
                    const isErrorForAI = line.type === 'error' || line.type === 'critical';
                    let lineClass = 'text-text-secondary';
                    if (line.type === 'warning') lineClass = 'text-yellow';
                    if (line.type === 'error') lineClass = 'text-red';
                    if (line.type === 'critical') lineClass = 'text-red font-bold';
                    
                    return (
                        <div
                        key={index}
                        className={`relative group whitespace-pre-wrap break-all px-2 py-0.5 rounded ${index % 2 === 0 ? 'bg-background/50' : ''}`}
                        >
                        <span className={lineClass}>{line.text}</span>
                        {isErrorForAI && onAskAI && (
                            <button
                                onClick={() => onAskAI(line.text)}
                                className="absolute top-1/2 right-1 transform -translate-y-1/2 p-1 text-primary bg-panel-bg rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                title="Ask AI about this error"
                            >
                                <SparklesIcon />
                            </button>
                        )}
                        </div>
                    );
                    })
                : <span className="text-text-muted px-2 font-sans">{activeLog ? (isPaused ? `Tailing paused. Press play to resume...` : 'Waiting for log entries...') : 'Select a log file to begin tailing.'}</span>}
            </div>
        </div>
      </div>
    </Panel>
  );
};

export default LogTailPanel;
