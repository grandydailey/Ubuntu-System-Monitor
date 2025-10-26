import React, { useState, useEffect } from 'react';
import Panel from './Panel';
import { RefreshIcon } from './icons';

type ServiceStatus = 'active' | 'down' | 'error' | 'restarting';

interface Service {
  name: string;
  status: ServiceStatus;
}

const statusConfig: { [key in ServiceStatus]: { dotClass: string; textClass: string; label: string } } = {
  active: { dotClass: 'bg-green', textClass: 'text-green', label: 'Active' },
  down: { dotClass: 'bg-red', textClass: 'text-red', label: 'Down' },
  error: { dotClass: 'bg-yellow', textClass: 'text-yellow', label: 'Error' },
  restarting: { dotClass: 'bg-primary animate-pulse', textClass: 'text-primary', label: 'Restarting' },
};

const NetworkPanel: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    { name: 'Apache2', status: 'active' },
    { name: 'MySQL', status: 'active' },
    { name: 'UFW', status: 'active' },
    { name: 'SSH', status: 'active' },
    { name: 'FTP', status: 'down' },
  ]);

  useEffect(() => {
    const serviceInterval = setInterval(() => {
        setServices(prevServices => 
            prevServices.map(service => {
                if (service.status === 'restarting') return service; // Don't interrupt restarts

                const rand = Math.random();
                let newStatus = service.status;
                
                // 5% chance of state change per interval
                if (rand < 0.05) { 
                    if (service.status === 'active') {
                        newStatus = 'down';
                    } else if (service.status === 'down') {
                        newStatus = Math.random() < 0.8 ? 'active' : 'error';
                    } else { // status is 'error'
                        newStatus = Math.random() < 0.7 ? 'active' : 'error';
                    }
                }
                return { ...service, status: newStatus };
            })
        );
    }, 3500); // Check services every 3.5 seconds

    return () => {
        clearInterval(serviceInterval);
    };
  }, []);

  const handleRestartService = (serviceName: string) => {
    setServices(prev => prev.map(s => {
        if (s.name === serviceName && (s.status === 'down' || s.status === 'error')) {
            return { ...s, status: 'restarting' };
        }
        return s;
    }));

    setTimeout(() => {
        setServices(prev => prev.map(s => {
            if (s.name === serviceName && s.status === 'restarting') {
                const success = Math.random() < 0.8; // 80% success rate
                return { ...s, status: success ? 'active' : 'error' };
            }
            return s;
        }));
    }, 1500); // 1.5-second restart delay
  };

  return (
    <Panel title="systemctl --status-all">
      <div className="p-3 h-full overflow-y-auto">
        <div className="space-y-2">
            {services.map(service => {
                const config = statusConfig[service.status];
                const isRestartable = service.status === 'down' || service.status === 'error';
                
                return (
                    <button 
                        key={service.name}
                        onClick={() => handleRestartService(service.name)}
                        disabled={!isRestartable}
                        className={`w-full bg-background/50 p-2 rounded-md text-sm font-mono flex items-center justify-between space-x-2 overflow-hidden transition-colors duration-200 ${isRestartable ? 'cursor-pointer hover:bg-panel-header' : 'cursor-default'}`}
                        aria-label={isRestartable ? `Restart ${service.name}` : `${service.name} is ${service.status}`}
                    >
                        <div className="flex items-center space-x-2">
                            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${config.dotClass}`}></span>
                            <span className="text-text-secondary truncate">{service.name}</span>
                        </div>
                        <div className={`font-bold ${config.textClass} flex items-center space-x-1.5`}>
                           {service.status === 'restarting' && <RefreshIcon className="animate-spin" />}
                           <span>{config.label}</span>
                        </div>
                    </button>
                )
            })}
        </div>
      </div>
    </Panel>
  );
};

export default NetworkPanel;
