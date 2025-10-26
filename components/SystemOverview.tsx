import React, { useEffect, useState } from 'react';

interface SystemOverviewProps {
  onContinue: () => void;
}

const SystemOverview: React.FC<SystemOverviewProps> = ({ onContinue }) => {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const handleInteraction = () => {
      onContinue();
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [onContinue]);
  
  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const Line: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <p>
        <span className="text-primary">{label.padEnd(20)}:</span>
        <span className="text-text-main">{value}</span>
    </p>
  );

  return (
    <div className="flex items-center justify-center h-full p-4 cursor-pointer font-mono">
        <div className="w-full max-w-2xl text-sm">
            <p className="mb-4">Welcome back, <span className="text-green">namour</span>.</p>
            
            <p className="mb-2 text-yellow">$ systemctl status</p>
            <div className="pl-4 border-l-2 border-border space-y-1">
                <Line label="System" value="ubuntu-prod-01 (Ubuntu 22.04.3 LTS)" />
                <Line label="Kernel" value="5.15.0-78-generic" />
                <Line label="Uptime" value="3 days, 14 hours, 21 minutes" />
                <Line label="Last Login" value={`Fri Jul 19 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} from 127.0.0.1`} />
                <Line label="CPU" value="Intel(R) Xeon(R) CPU E5-2673 v3 @ 2.40GHz (4 cores)" />
                <Line label="Load Average" value="0.75, 0.82, 0.65" />
                <Line label="Memory" value="4.2G / 16.0G used" />
                <Line label="Active Services" value="systemd, sshd, cron, apache2, docker" />
                <Line label="Network" value="enp0s3: 192.168.1.150" />
                <Line label="System Status" value="● Running" />
            </div>

            <div className="mt-8 text-center">
                <p className="text-text-muted">
                    Press any key to continue...
                    <span className={`inline-block w-2 h-4 ml-1 align-middle ${showCursor ? 'bg-green' : 'bg-transparent'}`}></span>
                </p>
            </div>
        </div>
    </div>
  );
};

export default SystemOverview;