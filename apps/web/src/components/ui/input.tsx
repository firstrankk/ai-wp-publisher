'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            className
          )}
          style={{
            backgroundColor: '#ffffff',
            color: '#1f2937',
            borderColor: error ? '#ef4444' : '#e5e7eb',
            ...style
          }}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm" style={{ color: '#ef4444' }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
