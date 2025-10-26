import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { DiskIcon, AlertTriangleIcon, FailingDiskIcon, SparklesIcon } from './icons';
import type { DiskPartition } from '../types';

interface DiskPanelProps {
  onAskAI?: (query: string) => void;
}

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; isWarning?: boolean; }> = ({ icon, label, value, isWarning }) => (
  <div className="flex items-center space-x-2 text-xs">
    {icon}
    <span className="text-text-secondary">{label}:</span>
    <span className={isWarning ? "text-red" : "text-green"}>{value}</span>
  </div>
);

const ProgressBar: React.FC<{ percent: number; isFailing?: boolean; }> = ({ percent, isFailing }) => {
  let bgColor = 'bg-green';
  if (isFailing) {
    bgColor = 'bg-red';
  } else if (percent > 95) {
    bgColor = 'bg-red';
  } else if (percent > 85) {
    bgColor = 'bg-yellow';
  }
  
  const width = isFailing ? 100 : percent;

  return (
    <div className="w-full bg-border rounded-full h-1.5">
      <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${width}%` }}></div>
    </div>
  );
};

const DiskPanel: React.FC<DiskPanelProps> = ({ onAskAI }) => {
  const [diskStats, setDiskStats] = useState<DiskPartition[]>([
    { name: 'sda1', used: 0.5, total: 1.0, status: 'ok', temperature: 35, powerOnHours: 12050, readErrors: 0, writeErrors: 0 },
    { name: 'sda2', used: 0.25, total: 1.0, status: 'failing', temperature: 68, powerOnHours: 8500, readErrors: 152, writeErrors: 98 },
    { name: 'sda3', used: 860, total: 950, status: 'ok', temperature: 42, powerOnHours: 2500, readErrors: 2, writeErrors: 0 },
    { name: 'sda4', used: 5, total: 24, status: 'ok', temperature: 38, powerOnHours: 18321, readErrors: 0, writeErrors: 1 },
  ]);
  const [diagnosingDisks, setDiagnosingDisks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiskStats(prevDiskStats => {
        const newlyFailedDisks: DiskPartition[] = [];
        const nextDiskStats = prevDiskStats.map(p => {
          // Handle already failing disks
          if (p.status === 'failing') {
            return {
              ...p,
              temperature: Math.min(85, p.temperature + Math.random() * 1.5),
              readErrors: p.readErrors + Math.floor(Math.random() * 5),
              writeErrors: p.writeErrors + Math.floor(Math.random() * 3),
              powerOnHours: p.powerOnHours + 2,
            };
          }

          // Simulate stat changes for ok disks
          let updatedPartition = {
            ...p,
            used: Math.max(0, Math.min(p.total, p.used + (Math.random() - 0.49) * (p.total * 0.005))),
            powerOnHours: p.powerOnHours + 2,
            temperature: Math.max(30, Math.min(70, p.temperature + (Math.random() - 0.5) * 0.5)),
            readErrors: p.readErrors + (Math.random() < 0.01 ? 1 : 0),
            writeErrors: p.writeErrors + (Math.random() < 0.005 ? 1 : 0),
          };

          // Check for transition to failing state
          const usagePercent = (updatedPartition.used / updatedPartition.total) * 100;
          let failureChance = 0.001; // Base chance
          if (usagePercent > 98 || updatedPartition.temperature > 65 || updatedPartition.readErrors > 50) {
            failureChance = 0.01;
          } else if (usagePercent > 90 || updatedPartition.temperature > 60 || updatedPartition.readErrors > 10) {
            failureChance = 0.005;
          }
          
          if (Math.random() < failureChance) {
            const failedDisk = { ...updatedPartition, status: 'failing' as const, temperature: updatedPartition.temperature + 10 };
            newlyFailedDisks.push(failedDisk);
            return failedDisk;
          }
          
          return updatedPartition;
        });

        if (newlyFailedDisks.length > 0 && onAskAI) {
            const diskDetails = newlyFailedDisks.map(p => 
                `- /dev/${p.name} (Total: ${p.total.toFixed(1)}G, Used: ${p.used.toFixed(1)}G (${(p.used * 100 / p.total).toFixed(1)}%), Temp: ${((p.temperature * 9/5) + 32).toFixed(0)}°F, Power On Hours: ${p.powerOnHours.toLocaleString()}, Read Errors: ${p.readErrors}, Write Errors: ${p.writeErrors})`
            ).join('\n');

            const prompt = `The following disk(s) on my Ubuntu server are reporting a 'failing' status. Here is the latest available health data:\n\n${diskDetails}\n\nThis is a critical hardware alert. Please explain the probable causes based on this data, provide diagnostic steps (like using smartctl) to investigate these failures, and recommend a course of action to prevent data loss.`;
            onAskAI(prompt);
            
            const newDiskNames = newlyFailedDisks.map(d => d.name);
            setDiagnosingDisks(prev => new Set([...prev, ...newDiskNames]));

            setTimeout(() => {
                setDiagnosingDisks(prev => {
                    const next = new Set(prev);
                    newDiskNames.forEach(name => next.delete(name));
                    return next;
                });
            }, 10000); // Show indicator for 10 seconds
        }

        return nextDiskStats;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [onAskAI]);

  return (
    <Panel title="./df -h --show-health">
      <div className="p-2 space-y-1 overflow-y-auto flex-grow font-mono">
        {diskStats.map((partition, index) => {
          const diskPercent = (partition.used / partition.total) * 100;
          const isHighUsage = diskPercent > 85 && diskPercent <= 95;
          const isCriticalUsage = diskPercent > 95;
          const isFailing = partition.status === 'failing';
          const isDiagnosing = diagnosingDisks.has(partition.name);
          
          const PartitionIcon = isFailing ? FailingDiskIcon : DiskIcon;
          
          const containerClasses = `space-y-1 p-2 rounded-md transition-colors duration-300 ${
            isFailing ? 'bg-red/20 animate-pulse' : (index % 2 === 0 ? 'bg-background/30' : '')
          }`;

          return (
            <div key={partition.name} className={containerClasses}>
              <div className="flex items-center justify-between">
                <StatItem
                  icon={<PartitionIcon />}
                  label={`/dev/${partition.name} (${partition.total.toFixed(1)}G)`}
                  value={isFailing ? 'STATUS: FAILING' : `${diskPercent.toFixed(1)}% used (${partition.used.toFixed(1)}G)`}
                  isWarning={isCriticalUsage || isFailing}
                />
                {isDiagnosing ? (
                  <div className="flex items-center space-x-1 text-primary text-xs animate-pulse">
                      <SparklesIcon className="w-3 h-3"/>
                      <span>AI Diagnosing...</span>
                  </div>
                ) : !isFailing && (isHighUsage || isCriticalUsage) && (
                  <AlertTriangleIcon className={isCriticalUsage ? "text-red" : "text-yellow"} />
                )}
              </div>
              <div title={isFailing ? 'Disk health critical! Data at risk.' : `Used: ${partition.used.toFixed(1)}G / Total: ${partition.total.toFixed(1)}G`}>
                <ProgressBar percent={diskPercent} isFailing={isFailing} />
              </div>
              <div className="flex justify-between items-center text-xs text-text-muted pt-1">
                <span title="Temperature">
                  Temp: <span className={partition.temperature > 60 ? 'text-yellow font-semibold' : 'text-text-main'}>{((partition.temperature * 9/5) + 32).toFixed(0)}°F</span>
                </span>
                <span title="Power On Hours">
                  POH: <span className="text-text-main">{partition.powerOnHours.toLocaleString()}</span>
                </span>
                <span title="Read Errors">
                  R.Err: <span className={partition.readErrors > 0 ? 'text-yellow font-semibold' : 'text-text-main'}>{partition.readErrors}</span>
                </span>
                <span title="Write Errors">
                  W.Err: <span className={partition.writeErrors > 0 ? 'text-yellow font-semibold' : 'text-text-main'}>{partition.writeErrors}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export default DiskPanel;