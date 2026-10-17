import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  icon: Icon
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full rounded-surface bg-bg-editor border px-3 py-2 text-sm text-text-main placeholder-text-muted/60 transition-colors focus:outline-none focus:ring-1 focus:ring-accent ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-error focus:border-error focus:ring-error/50' : 'border-border focus:border-accent'} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
