import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-gray-500 dark:text-white uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 group-focus-within:text-indigo-500 transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={`
            w-full py-2.5 bg-white dark:bg-black border rounded-xl text-sm transition-all outline-none
            ${leftIcon ? 'pl-11' : 'pl-4'}
            ${rightIcon ? 'pr-11' : 'pr-4'}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:text-white'}
            disabled:bg-gray-50 dark:disabled:bg-white/5 disabled:text-gray-500
            placeholder:text-gray-400 dark:placeholder:text-white/20
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] font-semibold text-red-500 ml-1">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-gray-400 ml-1">{helperText}</p>}
    </div>
  );
};
