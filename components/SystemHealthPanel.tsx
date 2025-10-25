import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SystemStats, PerformanceData, GroupedError } from '../types';
import { CpuIcon, MemoryIcon, TemperatureIcon, WifiIcon, AlertTriangleIcon, ServerIcon, OsIcon } from './icons';
import Panel from './Panel';
import ErrorModal from './ErrorModal';
import { SYSLOG_DATA, APACHE_ERROR_LOG_SAMPLE } from '../data/mockLogs';

interface RawError {
  message: string;
  timestamp: string;
}

const SystemHealthPanel: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    temp: 55,
    memory: { used: 4.2, total: 16.0 },
    wifi: { ssid: 'Ubuntu-Net', signal: 88 },
  });
  
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>(
    Array.from({ length: 10 }, (_, i) => ({ name: `${i}`, cpu: Math.random() * 20 }))
  );

  const [logErrors, setLogErrors] = useState({ syslog: 0, apache: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unacknowledgedErrors, setUnacknowledgedErrors] = useState<GroupedError[]>([]);
  const prevLogErrorsRef = useRef({ syslog: 0, apache: 0 });
  const [errorKey, setErrorKey] = useState({ syslog: 0, apache: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => ({
        temp: 50 + Math.random() * 15,
        memory: { 
          used: Math.max(2.0, Math.min(15.5, prevStats.memory.used + (Math.random() - 0.5) * 0.2)),
          total: 16.0
        },
        wifi: {
          ...prevStats.wifi,
          signal: 70 + Math.random() * 30
        }
      }));

      setPerformanceData(prevData => {
        const newData = [...prevData.slice(1), { name: `${parseInt(prevData[9].name) + 1}`, cpu: Math.random() * 40 + 5 }];
        return newData;
      });

      const syslogErrorLines = SYSLOG_DATA.filter(line => line.toLowerCase().includes('error') || line.toLowerCase().includes('failed'));
      const apacheErrorLines = APACHE_ERROR_LOG_SAMPLE.filter(line => line.toLowerCase().includes('error'));

      const syslogErrorCount = syslogErrorLines.length + Math.floor(Math.random() * 3);
      const apacheErrorCount = apacheErrorLines.length + Math.floor(Math.random()*2);

      const newErrors: RawError[] = [];
      const timestamp = new Date().toLocaleTimeString();

      const newSyslog = syslogErrorCount > prevLogErrorsRef.current.syslog;
      const newApache = apacheErrorCount > prevLogErrorsRef.current.apache;
      
      if (newSyslog) {
          setErrorKey(k => ({ ...k, syslog: k.syslog + 1 }));
          const lastSyslogError = syslogErrorLines[syslogErrorLines.length - 1] || "Generic syslog error detected.";
          newErrors.push({ message: `SYSLOG: ${lastSyslogError}`, timestamp });
      }
      if (newApache) {
          setErrorKey(k => ({ ...k, apache: k.apache + 1 }));
          const lastApacheError = apacheErrorLines[apacheErrorLines.length - 1] || "Generic Apache error detected.";
          newErrors.push({ message: `APACHE: ${lastApacheError}`, timestamp });
      }

      if (newErrors.length > 0) {
        setUnacknowledgedErrors(prev => {
            const updatedErrors = [...prev];
            newErrors.forEach(newError => {
                const existingErrorIndex = updatedErrors.findIndex(e => e.message === newError.message);
                if (existingErrorIndex > -1) {
                    updatedErrors[existingErrorIndex] = {
                        ...updatedErrors[existingErrorIndex],
                        count: updatedErrors[existingErrorIndex].count + 1,
                    };
                } else {
                    updatedErrors.push({
                        message: newError.message,
                        count: 1,
                        firstTimestamp: newError.timestamp,
                    });
                }
            });
            return updatedErrors;
        });
      }

      prevLogErrorsRef.current = { syslog: syslogErrorCount, apache: apacheErrorCount };
      setLogErrors({ syslog: syslogErrorCount, apache: apacheErrorCount });

    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeErrors = () => {
    setUnacknowledgedErrors([]);
    setIsModalOpen(false);
  };

  const memPercent = (stats.memory.used / stats.memory.total) * 100;
  const totalErrorCount = unacknowledgedErrors.reduce((sum, error) => sum + error.count, 0);

  const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-2 text-xs">
      {icon}
      <span>{label}:</span>
      <span className="text-green-400">{value}</span>
    </div>
  );

  const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
    const bgColor = percent > 85 ? 'bg-red-500' : percent > 60 ? 'bg-yellow-500' : 'bg-green-500';
    return (
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    );
  };

  return (
    <>
      <Panel title="System Health Overview" className="!bg-gray-900/50 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
          <div className="space-y-1">
            <h3 className="text-green-400 font-bold mb-1">./status</h3>
            <StatItem icon={<ServerIcon />} label="Server" value="ubuntu-prod-01" />
            <StatItem icon={<OsIcon />} label="OS" value="Ubuntu 22.04.3 LTS" />
            <StatItem icon={<TemperatureIcon />} label="CPU Temp" value={`${stats.temp.toFixed(1)}°C`} />
            <StatItem icon={<WifiIcon />} label="WiFi" value={`${stats.wifi.ssid} (${stats.wifi.signal.toFixed(0)}%)`} />
            <div className="space-y-1 pt-1">
              <StatItem icon={<MemoryIcon />} label="Memory" value={`${memPercent.toFixed(1)}% (${stats.memory.used.toFixed(1)}G/${stats.memory.total}G)`} />
              <ProgressBar percent={memPercent} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-yellow-400 font-bold">./log_monitor</h3>
            <div key={`syslog-${errorKey.syslog}`} className={`flex items-center space-x-2 p-1 -m-1 rounded ${errorKey.syslog > 0 ? 'animate-flash' : ''}`}>
              <AlertTriangleIcon className={logErrors.syslog > 0 ? "text-red-500" : "text-green-500"} />
              <span>System Log:</span>
              <span className={logErrors.syslog > 0 ? "text-red-500" : "text-green-500"}>
                {logErrors.syslog} errors
              </span>
            </div>
            <div key={`apache-${errorKey.apache}`} className={`flex items-center space-x-2 p-1 -m-1 rounded ${errorKey.apache > 0 ? 'animate-flash' : ''}`}>
              <AlertTriangleIcon className={logErrors.apache > 0 ? "text-red-500" : "text-green-500"} />
              <span>Apache2 Error Log:</span>
              <span className={logErrors.apache > 0 ? "text-red-500" : "text-green-500"}>
                {logErrors.apache} errors
              </span>
            </div>
            {totalErrorCount > 0 && (
                <div className="pt-2">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-yellow-600/50 hover:bg-yellow-500/50 border border-yellow-500 text-yellow-200 font-bold py-1 px-2 rounded transition-colors duration-200 animate-pulse"
                    >
                        {totalErrorCount} New Error(s) - Click to View
                    </button>
                </div>
            )}
            <div className="text-gray-500 pt-2">
              <p>Monitoring syslog & apache2/error.log</p>
              <p>Status: <span className="text-green-400">ACTIVE</span></p>
            </div>
          </div>

          <div className="h-40 md:h-full">
            <h3 className="text-purple-400 font-bold mb-2">./performance_data</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="name" stroke="#A0AEC0" tick={{fontSize: 10}}/>
                  <YAxis stroke="#A0AEC0" domain={[0, 100]} tick={{fontSize: 10}} label={{ value: 'CPU %', angle: -90, position: 'insideLeft', fill: '#A0AEC0', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} labelStyle={{ color: '#E2E8F0' }} />
                  <Line type="monotone" dataKey="cpu" stroke="#38B2AC" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
          </div>
        </div>
      </Panel>
      <ErrorModal 
        isOpen={isModalOpen}
        errors={unacknowledgedErrors}
        onClose={handleAcknowledgeErrors}
      />
    </>
  );
};

export default SystemHealthPanel;