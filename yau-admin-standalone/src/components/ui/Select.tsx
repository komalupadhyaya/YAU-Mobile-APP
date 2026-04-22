import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
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
        <select
          id={id}
          className={`
            w-full appearance-none px-4 py-2.5 bg-white dark:bg-black border rounded-xl text-sm dark:text-white transition-all outline-none cursor-pointer
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-gray-200 dark:border-white/20 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}
            disabled:bg-gray-50 disabled:text-gray-500
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-indigo-500 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && <p className="text-[11px] font-semibold text-red-500 ml-1">{error}</p>}
    </div>
  );
};
