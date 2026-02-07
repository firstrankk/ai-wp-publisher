'use client';

import { useState, createContext, useContext } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Menu, X } from 'lucide-react';

// Sidebar context for managing open/close state
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapsed

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isCollapsed, setIsCollapsed }}>
      <div className="flex h-screen" style={{ backgroundColor: '#f9fafb' }}>
        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 lg:relative lg:z-0
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile header with menu button */}
          <div className="sticky top-0 z-30 lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <span className="font-semibold text-gray-900">AI Publisher</span>
          </div>

          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
