'use client';

import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: Trash2,
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: '#fffbeb',
    iconColor: '#f59e0b',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: Info,
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'ยืนยันการดำเนินการ',
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: styles.iconBg }}
        >
          <Icon className="w-8 h-8" style={{ color: styles.iconColor }} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#1f2937' }}>
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            className={`flex-1 ${styles.buttonClass}`}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
