import React, { useState, useEffect } from 'react';
import Panel from './Panel';

const NUM_BARS = 32;

const CavaPanel: React.FC = () => {
  const [bars, setBars] = useState<number[]>(new Array(NUM_BARS).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prevBars => {
        return prevBars.map(bar => {
          const randomChange = (Math.random() - 0.4) * 25;
          const newHeight = Math.max(0, Math.min(100, bar + randomChange));
          return newHeight;
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getBarColor = (height: number) => {
    if (height > 85) return 'from-red-500 to-yellow-500';
    if (height > 60) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-cyan-500';
  };

  return (
    <Panel title="cava -p /path/to/cava.conf" className="!bg-gray-900/50 backdrop-blur-sm">
      <div className="p-4 h-full flex items-end justify-center space-x-1 overflow-hidden">
        {bars.map((height, index) => (
          // FIX: Combined duplicate `className` attributes into one. The element had two className props, which is invalid JSX.
          // Also removed the redundant `backgroundImage` style as it's handled by Tailwind's gradient classes.
          <div
            key={index}
            className={`w-full rounded-t-sm transition-all duration-100 ease-linear bg-gradient-to-t ${getBarColor(height)}`}
            style={{ 
              height: `${height}%`,
            }}
          />
        ))}
      </div>
    </Panel>
  );
};

export default CavaPanel;