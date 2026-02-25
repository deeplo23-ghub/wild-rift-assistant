
import React from 'react';

export const LogoText: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span className={`font-sans font-medium text-4xl tracking-tight text-white select-none ${className}`}>
      Draft Pick Assistant
    </span>
  );
};
