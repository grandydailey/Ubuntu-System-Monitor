
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Panel from './Panel';
import { AUTH_LOG_SAMPLE, APACHE_LOG_SAMPLE, FAIL2BAN_LOG_SAMPLE, MYSQL_LOG_SAMPLE, APACHE_ERROR_LOG_SAMPLE, NAMOUR_ACCESS_LOG_SAMPLE, RANDY_UPLOAD_ACCESS_LOG_SAMPLE, NAMOUR_ERROR_LOG_SAMPLE, RANDY_UPLOAD_ERROR_LOG_SAMPLE } from '../data/mockLogs';
import { SpeakerOnIcon, SpeakerOffIcon, PauseIcon, PlayIcon, SparklesIcon, FileIcon } from './icons';

type LogSource = 'auth' | 'apache' | 'fail2ban' | 'mysql' | 'apache_error' | 'namour_access' | 'randy_upload_access' | 'namour_error' | 'randy_upload_error';
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
    { id: 'fail2ban', label: 'fail2ban.log', path: '/var/log/' },
    { id: 'mysql', label: 'mysql.log', path: '/var/log/' },
    { id: 'apache', label: 'access.log', path: '/var/log/apache2/' },
    { id: 'apache_error', label: 'error.log', path: '/var/log/apache2/' },
    { id: 'namour_access', label: 'namour_access.log', path: '/var/log/apache2/' },
    { id: 'namour_error', label: 'namour_error.log', path: '/var/log/apache2/' },
    { id: 'randy_upload_access', label: 'randy-upload_access.log', path: '/var/log/apache2/' },
    { id: 'randy_upload_error', label: 'randy-upload_error.log', path: '/var/log/apache2/' },
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
        case 'apache_error': source = APACHE_ERROR_LOG_SAMPLE; break;
        case 'namour_access': source = NAMOUR_ACCESS_LOG_SAMPLE; break;
        case 'randy_upload_access': source = RANDY_UPLOAD_ACCESS_LOG_SAMPLE; break;
        case 'namour_error': source = NAMOUR_ERROR_LOG_SAMPLE; break;
        case 'randy_upload_error': source = RANDY_UPLOAD_ERROR_LOG_SAMPLE; break;
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
      } else if (activeLog === 'apache' || activeLog === 'namour_access' || activeLog === 'randy_upload_access') {
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
      } else if (activeLog === 'apache_error' || activeLog === 'namour_error' || activeLog === 'randy_upload_error') {
        if (lowerLine.includes('error')) {
            lineType = 'error';
            playAlertSound();
        } else if (lowerLine.includes('warn') || lowerLine.includes('notice')) {
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

  const activeLogInfo = useMemo(() => {
    return logSources.find(s => s.id === activeLog);
  }, [activeLog]);

  const panelTitle = activeLogInfo ? `tail -f ${activeLogInfo.path}${activeLogInfo.label}` : 'tail -f [log_file]';
  
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
    <Panel title={panelTitle} className="flex flex-col !bg-sky-50 dark:!bg-sky-950/50">
      {activeLog === null ? (
        <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto">
            <h3 className="text-lg font-bold text-text-main mb-4 font-sans">Select a log file to tail</h3>
            <div className="w-full max-w-sm space-y-2">
                {logSources.map(source => (
                    <button
                        key={source.id}
                        onClick={() => handleSelectLog(source.id)}
                        className="w-full text-left p-3 rounded-md flex items-center space-x-3 text-sm transition-colors duration-150 bg-panel-header hover:bg-border hover:text-text-main"
                    >
                        <FileIcon className="w-5 h-5 flex-shrink-0 text-primary"/>
                        <div className="truncate">
                            <span className="font-bold text-text-main block truncate">{source.label}</span>
                            <span className="text-xs text-text-muted block truncate">{source.path}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      ) : (
        <div className="flex flex-col flex-grow overflow-hidden">
            <div className="p-2 border-b border-border flex justify-between items-center flex-wrap gap-2">
                 <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveLog(null)}
                        className="text-xs bg-panel-header hover:bg-border text-text-secondary px-2 py-1 rounded-md transition-colors"
                    >
                        Change Log
                    </button>
                    <div className="h-4 border-l border-border mx-1"></div>
                    <div className="flex items-center space-x-1 p-0.5 bg-background rounded-lg">
                        <SeverityButton level="all" color="bg-primary/80">All</SeverityButton>
                        <SeverityButton level="error" color="bg-red">Error</SeverityButton>
                        <SeverityButton level="warning" color="bg-yellow">Warning</SeverityButton>
                        <SeverityButton level="info" color="bg-green">Info</SeverityButton>
                    </div>
                </div>
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
      )}
    </Panel>
  );
};

export default LogTailPanel;