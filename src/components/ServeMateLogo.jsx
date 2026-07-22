import React from 'react';

export const ServeMateLogo = ({ size = 'md', className = '' }) => {
  // Prominent Header Logo Height
  const heightPx = size === 'sm' ? '50px' : size === 'lg' ? '80px' : '68px';

  return (
    <div className={`inline-flex items-center select-none cursor-pointer group shrink-0 ${className}`}>
      {/* 100% True Transparent PNG Logo - Prominent 68px Navbar Size */}
      <img 
        src="/logo.png" 
        alt="ServeMate by Resence Logo" 
        style={{ height: heightPx, width: 'auto', objectFit: 'contain' }}
        className="block transition-transform duration-300 group-hover:scale-105 filter drop-shadow-lg"
      />
    </div>
  );
};
