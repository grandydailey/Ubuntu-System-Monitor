import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { AUTH_LOG_SAMPLE, APACHE_LOG_SAMPLE } from '../data/mockLogs';

type LogSource = 'auth' | 'apache';

// Define audio context at module level, to be initialized on user gesture.
let audioContext: AudioContext | null = null;

const playAlertSound = () => {
  if (!audioContext) {
    console.warn('AudioContext not initialized. Click a log button to enable audio alerts.');
    return;
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(900, audioContext.currentTime); // High-pitched alert
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // Keep volume low

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1); // 100ms beep
};

const playIntrusionAlertSound = () => {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sawtooth';
  gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);

  // Create a siren-like effect
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(660, audioContext.currentTime + 0.15);
  oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.3);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
};


const LogTailPanel: React.FC = () => {
  const [activeLog, setActiveLog] = useState<LogSource | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    let interval: number;

    if (activeLog) {
      setLogLines([]); // Clear previous logs
      interval = window.setInterval(() => {
        const source = activeLog === 'auth' ? AUTH_LOG_SAMPLE : APACHE_LOG_SAMPLE;
        const newLine = source[Math.floor(Math.random() * source.length)];
        
        const lowerLine = newLine.toLowerCase();
        const isSshdFailure = activeLog === 'auth' && lowerLine.includes('sshd') && lowerLine.includes('failed password');
        const isGeneralAuthError = activeLog === 'auth' && lowerLine.includes('failed');
        const isApacheError = activeLog === 'apache' && /"\s[45]\d{2}\s/.test(newLine);

        if (isSshdFailure) {
          playIntrusionAlertSound();
        } else if (isGeneralAuthError || isApacheError) {
          playAlertSound();
        }

        setLogLines(prevLines => {
          const updatedLines = [...prevLines, newLine];
          if (updatedLines.length > 100) {
            return updatedLines.slice(updatedLines.length - 100);
          }
          return updatedLines;
        });
      }, 800);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeLog]);

  const handleSelectLog = (source: LogSource) => {
    if (!audioContext && typeof window !== 'undefined') {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      <div className="p-2 border-b border-gray-700 flex space-x-2">
        <button onClick={() => handleSelectLog('auth')} className={getButtonClass('auth')}>
          auth.log
        </button>
        <button onClick={() => handleSelectLog('apache')} className={getButtonClass('apache')}>
          apache2/access.log
        </button>
      </div>
      <div className="p-2 flex-grow overflow-y-auto">
        <pre className="text-xs whitespace-pre-wrap break-all">
          {logLines.length > 0 
            ? logLines.join('\n')
            : <span className="text-gray-500">Select a log file to tail...</span>}
        </pre>
      </div>
    </Panel>
  );
};

export default LogTailPanel;