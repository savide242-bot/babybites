import { useState, useCallback, useEffect } from 'react';
import type { CustomToastProps } from '@/components/ui/custom-toast';

type ToastInput = Omit<CustomToastProps, 'id' | 'onClose'>;

interface Toast extends CustomToastProps {
  id: string;
}

const MAX_TOASTS = 3;

export const useCustomToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = input.duration ?? 5000;
    
    const toast: Toast = {
      ...input,
      id,
      onClose: () => removeToast(id)
    };

    setToasts((prev) => {
      const newToasts = [...prev, toast];
      // Keep only the most recent toasts
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(-MAX_TOASTS);
      }
      return newToasts;
    });

    // Auto-dismiss after duration (if duration > 0)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return {
      id,
      dismiss: () => removeToast(id)
    };
  }, [removeToast]);

  const dismissToast = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
    clearAll
  };
};
