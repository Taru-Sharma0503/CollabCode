import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-surface bg-bg-card border border-border p-5 shadow-sm transition-all ${
        hover ? 'hover:border-border-hover hover:shadow-md cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
