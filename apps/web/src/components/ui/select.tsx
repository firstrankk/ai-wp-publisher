'use client';

import { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, value, onChange, name, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync with external value changes
    useEffect(() => {
      setSelectedValue(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      setIsOpen(false);
      if (onChange) {
        onChange({ target: { value: optionValue, name } });
      }
    };

    const selectedOption = options.find(opt => opt.value === selectedValue);
    const displayText = selectedOption?.label || placeholder || 'Select...';

    return (
      <div className="relative w-full" ref={containerRef}>
        {/* Hidden native select for form compatibility */}
        <select
          ref={ref}
          name={name}
          value={selectedValue}
          onChange={(e) => handleSelect(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            className
          )}
          style={{
            backgroundColor: '#ffffff',
            color: selectedOption ? '#1f2937' : '#9ca3af',
            borderColor: error ? '#ef4444' : '#e5e7eb'
          }}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            style={{ color: '#9ca3af' }}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full min-w-[160px] rounded-lg border shadow-lg overflow-hidden" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
            <div className="max-h-60 overflow-auto py-1">
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  onMouseEnter={() => setHoveredIndex(-1)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors"
                  style={{
                    backgroundColor: selectedValue === '' ? '#eff6ff' : hoveredIndex === -1 ? '#f3f4f6' : 'transparent',
                    color: selectedValue === '' ? '#2563eb' : hoveredIndex === -1 ? '#1f2937' : '#6b7280'
                  }}
                >
                  {placeholder}
                </button>
              )}
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors"
                  style={{
                    backgroundColor: selectedValue === option.value ? '#eff6ff' : hoveredIndex === index ? '#f3f4f6' : 'transparent',
                    color: selectedValue === option.value ? '#2563eb' : hoveredIndex === index ? '#1f2937' : '#374151'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-1.5 text-sm" style={{ color: '#ef4444' }}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
