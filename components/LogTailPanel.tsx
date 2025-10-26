import React, { useState, useEffect, useRef, useCallback } from 'react';
import Panel from './Panel';
import { AUTH_LOG_SAMPLE, APACHE_LOG_SAMPLE } from '../data/mockLogs';
import { SpeakerOnIcon, SpeakerOffIcon, PauseIcon, PlayIcon, SparklesIcon } from './icons';

type LogSource = 'auth' | 'apache';
type LogLine = {
  text: string;
  type: 'normal' | 'error' | 'critical';
};

interface LogTailPanelProps {
    onAskAI?: (query: string) => void;
}

const LogTailPanel: React.FC<LogTailPanelProps> = ({ onAskAI }) => {
  const [activeLog, setActiveLog] = useState<LogSource | null>(null);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
    }
  }, [activeLog]);

  useEffect(() => {
    if (!activeLog || isPaused) return;

    const interval = window.setInterval(() => {
      const source = activeLog === 'auth' ? AUTH_LOG_SAMPLE : APACHE_LOG_SAMPLE;
      const newLineText = source[Math.floor(Math.random() * source.length)];
      
      const lowerLine = newLineText.toLowerCase();
      const isSshdFailure = activeLog === 'auth' && lowerLine.includes('sshd') && lowerLine.includes('failed password');
      const isApacheError = activeLog === 'apache' && /"\s[45]\d{2}\s/.test(newLineText);
      const isGeneralAuthError = activeLog === 'auth' && lowerLine.includes('failed') && !isSshdFailure;

      let lineType: LogLine['type'] = 'normal';
      if (isSshdFailure) {
        playIntrusionAlertSound();
        lineType = 'critical';
      } else if (isGeneralAuthError || isApacheError) {
        playAlertSound();
        lineType = 'error';
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

  const getButtonClass = (source: LogSource) => 
    `px-4 py-2 rounded-md transition-colors duration-200 ${
      activeLog === source 
        ? 'bg-cyan-500 text-black' 
        : 'bg-gray-700 hover:bg-gray-600'
    }`;

  return (
    <Panel title="tail -f [log_file]" className="flex flex-col">
      <div className="p-2 border-b border-gray-700 flex justify-between items-center">
        <div className="flex space-x-2">
            <button onClick={() => handleSelectLog('auth')} className={getButtonClass('auth')}>
            auth.log
            </button>
            <button onClick={() => handleSelectLog('apache')} className={getButtonClass('apache')}>
            apache2/access.log
            </button>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={() => setIsPaused(!isPaused)}
                disabled={!activeLog}
                className={`p-2 rounded-md transition-colors duration-200 ${isPaused ? 'text-green-400 bg-gray-700 hover:bg-gray-600' : 'text-yellow-400 bg-gray-700 hover:bg-gray-600'} disabled:text-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed`}
                aria-label={isPaused ? 'Resume log tailing' : 'Pause log tailing'}
            >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-md transition-colors duration-200 ${isMuted ? 'text-gray-500 bg-gray-800 hover:bg-gray-700' : 'text-cyan-400 bg-gray-700 hover:bg-gray-600'}`}
                aria-label={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            >
                {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
        </div>
      </div>
      <div className="p-2 flex-grow overflow-y-auto text-xs">
        {logLines.length > 0 
          ? logLines.map((line, index) => {
              const isError = line.type === 'error' || line.type === 'critical';
              let lineClass = 'text-gray-300';
              if (line.type === 'error') lineClass = 'text-yellow-400';
              if (line.type === 'critical') lineClass = 'text-red-500 font-bold';
              
              return (
                <div 
                  key={index}
                  className={`relative group whitespace-pre-wrap break-all px-2 py-0.5 rounded ${index % 2 === 0 ? 'bg-gray-800/50' : ''}`}
                >
                  <span className={lineClass}>{line.text}</span>
                  {isError && onAskAI && (
                    <button
                        onClick={() => onAskAI(line.text)}
                        className="absolute top-1/2 right-1 transform -translate-y-1/2 p-1 text-cyan-400 bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        title="Ask AI about this error"
                    >
                        <SparklesIcon />
                    </button>
                  )}
                </div>
              );
            })
          : <span className="text-gray-500 px-2">{activeLog ? (isPaused ? `Tailing paused. Press play to resume...` : 'Waiting for log entries...') : 'Select a log file to tail...'}</span>}
      </div>
    </Panel>
  );
};

export default LogTailPanel;