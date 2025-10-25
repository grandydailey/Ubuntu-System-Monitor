import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

// Helper to format bytes into KB, MB, GB
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i >= sizes.length) return '0 Bytes';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const NetworkPanel: React.FC = () => {
  const [downSpeed, setDownSpeed] = useState(0);
  const [upSpeed, setUpSpeed] = useState(0);
  const [totalDown, setTotalDown] = useState(0);
  const [totalUp, setTotalUp] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate network traffic (in bytes per second)
      const currentDown = Math.random() * 2 * 1024 * 1024; // 0 to 2 MB/s
      const currentUp = Math.random() * 512 * 1024;       // 0 to 512 KB/s
      
      setDownSpeed(currentDown);
      setUpSpeed(currentUp);

      // Update totals, assuming interval is 2 seconds
      setTotalDown(prev => prev + currentDown * 2);
      setTotalUp(prev => prev + currentUp * 2);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const StatLine: React.FC<{
    icon: React.ReactNode;
    label: string;
    speed: number;
    total: number;
    colorClass: string;
  }> = ({ icon, label, speed, total, colorClass }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-gray-300">{label}</span>
      </div>
      <div className="text-right">
        <p className={`${colorClass} font-semibold`}>{`${formatBytes(speed)}/s`}</p>
        <p className="text-xs text-gray-500">{`Total: ${formatBytes(total)}`}</p>
      </div>
    </div>
  );

  return (
    <Panel title="./net_monitor">
      <div className="p-3 space-y-4 flex flex-col justify-around h-full">
        <StatLine
          icon={<ArrowDownIcon className="text-green-400" />}
          label="Download"
          speed={downSpeed}
          total={totalDown}
          colorClass="text-green-400"
        />
        <StatLine
          icon={<ArrowUpIcon className="text-yellow-400" />}
          label="Upload"
          speed={upSpeed}
          total={totalUp}
          colorClass="text-yellow-400"
        />
      </div>
    </Panel>
  );
};

export default NetworkPanel;
