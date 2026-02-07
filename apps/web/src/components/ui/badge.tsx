import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { backgroundColor: '#f3f4f6', color: '#374151' },
  success: { backgroundColor: '#dcfce7', color: '#166534' },
  warning: { backgroundColor: '#fef3c7', color: '#92400e' },
  danger: { backgroundColor: '#fee2e2', color: '#991b1b' },
  info: { backgroundColor: '#dbeafe', color: '#1e40af' },
};

export function Badge({ className, variant = 'default', style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}
