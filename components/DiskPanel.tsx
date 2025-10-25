import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { DiskIcon } from './icons';
import type { DiskPartition } from '../types';

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

const DiskPanel: React.FC = () => {
  const [diskStats, setDiskStats] = useState<DiskPartition[]>([
    { name: 'sda1', used: 0.5, total: 1.0 },
    { name: 'sda2', used: 0.25, total: 1.0 },
    { name: 'sda3', used: 350, total: 950 },
    { name: 'sda4', used: 5, total: 24 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiskStats(prevDiskStats =>
        prevDiskStats.map(p => ({ ...p, used: Math.max(0, Math.min(p.total, p.used + (Math.random() - 0.49) * 0.02)) }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Panel title="./df -h">
      <div className="p-2 space-y-2 overflow-y-auto flex-grow">
        {diskStats.map((partition) => {
          const diskPercent = (partition.used / partition.total) * 100;
          return (
            <div key={partition.name} className="space-y-1">
              <StatItem
                icon={<DiskIcon />}
                label={`/dev/${partition.name}`}
                value={`${diskPercent.toFixed(1)}% (${partition.used.toFixed(1)}G/${partition.total}G)`}
              />
              <ProgressBar percent={diskPercent} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export default DiskPanel;
