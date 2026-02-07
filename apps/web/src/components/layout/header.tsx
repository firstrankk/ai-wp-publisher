'use client';

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header
      className="border-b px-6 py-4"
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1f2937' }}>{title}</h1>
          {description && (
            <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {action}
        </div>
      </div>
    </header>
  );
}
