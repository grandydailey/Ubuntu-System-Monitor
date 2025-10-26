import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { DiskIcon, AlertTriangleIcon, FailingDiskIcon } from './icons';
import type { DiskPartition } from '../types';

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; isWarning?: boolean; }> = ({ icon, label, value, isWarning }) => (
  <div className="flex items-center space-x-2 text-xs">
    {icon}
    <span>{label}:</span>
    <span className={isWarning ? "text-red-400" : "text-green-400"}>{value}</span>
  </div>
);

const ProgressBar: React.FC<{ percent: number; isFailing?: boolean; }> = ({ percent, isFailing }) => {
  let bgColor = 'bg-green-500';
  if (isFailing) {
    bgColor = 'bg-red-600 animate-pulse';
  } else if (percent > 85) {
    bgColor = 'bg-red-500';
  } else if (percent > 60) {
    bgColor = 'bg-yellow-500';
  }
  
  const width = isFailing ? 100 : percent;

  return (
    <div className="w-full bg-gray-700 rounded-full h-1.5">
      <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${width}%` }}></div>
    </div>
  );
};

const DiskPanel: React.FC = () => {
  const [diskStats, setDiskStats] = useState<DiskPartition[]>([
    { name: 'sda1', used: 0.5, total: 1.0, status: 'ok' },
    { name: 'sda2', used: 0.25, total: 1.0, status: 'failing' }, // Pre-set to failing for demo
    { name: 'sda3', used: 860, total: 950, status: 'ok' },
    { name: 'sda4', used: 5, total: 24, status: 'ok' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiskStats(prevDiskStats =>
        prevDiskStats.map(p => {
          let newStatus = p.status;
          // Once failing, it stays failing. If ok, it has a small chance to fail.
          if (p.status !== 'failing' && Math.random() < 0.003) {
            newStatus = 'failing';
          }
          return { 
            ...p, 
            // Stop updating usage if failing
            used: newStatus === 'failing' ? p.used : Math.max(0, Math.min(p.total, p.used + (Math.random() - 0.49) * (p.total * 0.005))),
            status: newStatus 
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Panel title="./df -h --alerts" className="!bg-gray-900/75 backdrop-blur-sm">
      <div className="p-2 space-y-2 overflow-y-auto flex-grow">
        {diskStats.map((partition) => {
          const diskPercent = (partition.used / partition.total) * 100;
          const isHighUsage = diskPercent > 85;
          const isFailing = partition.status === 'failing';
          
          const PartitionIcon = isFailing ? FailingDiskIcon : DiskIcon;

          return (
            <div key={partition.name} className={`space-y-1 p-1 rounded-md transition-colors duration-300 ${isFailing ? 'bg-red-900/40' : ''}`}>
              <div className="flex items-center justify-between">
                <StatItem
                  icon={<PartitionIcon />}
                  label={`/dev/${partition.name} (${partition.total.toFixed(1)}G)`}
                  value={isFailing ? 'STATUS: FAILING' : `${diskPercent.toFixed(1)}% used (${partition.used.toFixed(1)}G)`}
                  isWarning={isHighUsage || isFailing}
                />
                {isHighUsage && !isFailing && (
                  <AlertTriangleIcon className="text-red-500" />
                )}
              </div>
              <div title={isFailing ? 'Disk health critical! Data at risk.' : `Used: ${partition.used.toFixed(1)}G / Total: ${partition.total.toFixed(1)}G`}>
                <ProgressBar percent={diskPercent} isFailing={isFailing} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export default DiskPanel;