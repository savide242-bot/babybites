import * as React from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomToastProps {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  showProgress?: boolean;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2
};

const colorMap = {
  success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  loading: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
};

const iconColorMap = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
  loading: 'text-gray-600 dark:text-gray-400'
};

export const CustomToast = React.forwardRef<HTMLDivElement, CustomToastProps>(
  ({ id, title, description, type, duration = 5000, action, onClose, showProgress = true }, ref) => {
    const Icon = iconMap[type];
    const [isPaused, setIsPaused] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto relative flex w-full max-w-md flex-col gap-2 overflow-hidden rounded-2xl border-2 p-4 shadow-glow animate-in slide-in-from-top-5',
          colorMap[type]
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColorMap[type], type === 'loading' && 'animate-spin')} />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold leading-none tracking-tight">{title}</p>
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="mt-2 w-full rounded-lg bg-background/80 px-3 py-2 text-sm font-medium hover:bg-background transition-colors"
          >
            {action.label}
          </button>
        )}
        
        {showProgress && duration > 0 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-primary/30 transition-all"
            style={{
              width: '100%',
              animation: isPaused ? 'none' : `shrink ${duration}ms linear forwards`
            }}
          />
        )}
      </div>
    );
  }
);

CustomToast.displayName = 'CustomToast';
