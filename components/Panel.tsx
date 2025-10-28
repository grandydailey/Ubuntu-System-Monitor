import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const Panel: React.FC<PanelProps> = ({ title, children, className = '', titleClassName = '' }) => {
  return (
    <div className={`bg-panel-bg border border-border rounded-lg h-full flex flex-col overflow-hidden shadow-xl ${className}`}>
      <h2 className={`text-primary font-mono font-medium p-2 border-b border-border flex-shrink-0 ${titleClassName}`}>
        <span className="text-text-muted">$ </span>{title}
      </h2>
      {children}
    </div>
  );
};

export default Panel;