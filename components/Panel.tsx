
import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const Panel: React.FC<PanelProps> = ({ title, children, className = '', titleClassName = '' }) => {
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-md h-full flex flex-col overflow-hidden ${className}`}>
      <h2 className={`text-cyan-400 p-2 border-b border-gray-700 flex-shrink-0 ${titleClassName}`}>
        $ {title}
      </h2>
      {children}
    </div>
  );
};

export default Panel;
