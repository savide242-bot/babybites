import React, { Component, ErrorInfo, ReactNode } from 'react';
import { performPWARecovery } from '@/utils/pwaRecovery';
import { AlertTriangle, RefreshCw, Wrench } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRecovering: boolean;
  errorCount: number;
}

const ERROR_COUNT_KEY = 'app_error_count';

const isChunkLoadError = (error: Error | null): boolean => {
  if (!error) return false;
  const msg = error.message || '';
  const name = error.name || '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
};

const getLang = (): 'en' | 'es' => {
  try {
    const v = localStorage.getItem('app_language');
    return v === 'es' ? 'es' : 'en';
  } catch { return 'en'; }
};

const STRINGS = {
  en: {
    title: 'Something went wrong',
    body: 'The app encountered an error. This sometimes happens after updates. Try reloading.',
    reload: 'Reload App',
    repair: 'Repair App',
    repairing: 'Repairing...',
    repairHint: 'Repair clears cached data and may fix loading issues.',
  },
  es: {
    title: 'Algo salió mal',
    body: 'La aplicación encontró un error. A veces ocurre tras una actualización. Intenta recargar.',
    reload: 'Recargar app',
    repair: 'Reparar app',
    repairing: 'Reparando...',
    repairHint: 'Reparar borra los datos en caché y puede solucionar problemas de carga.',
  },
};

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    let count = 0;
    try { count = parseInt(sessionStorage.getItem(ERROR_COUNT_KEY) || '0', 10) || 0; } catch {}
    this.state = { hasError: false, error: null, isRecovering: false, errorCount: count };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, isRecovering: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    // Auto-recover from chunk load errors (transient post-deploy issue)
    if (isChunkLoadError(error)) {
      try { sessionStorage.setItem('chunk_reload', '1'); } catch {}
      setTimeout(() => window.location.reload(), 200);
      return;
    }
    try {
      const next = (this.state.errorCount || 0) + 1;
      sessionStorage.setItem(ERROR_COUNT_KEY, String(next));
      this.setState({ errorCount: next });
    } catch {}
  }

  handleReload = () => {
    try { sessionStorage.removeItem(ERROR_COUNT_KEY); } catch {}
    window.location.reload();
  };

  handleRepair = async () => {
    this.setState({ isRecovering: true });
    // Safety timeout — never leave the user stuck
    const timeout = setTimeout(() => window.location.reload(), 8000);
    try {
      await performPWARecovery();
    } catch (e) {
      console.error('Repair failed', e);
    } finally {
      clearTimeout(timeout);
      try { sessionStorage.removeItem(ERROR_COUNT_KEY); } catch {}
    }
  };

  render() {
    if (this.state.hasError) {
      // For chunk errors we're auto-reloading; don't flash the error UI
      if (isChunkLoadError(this.state.error)) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        );
      }

      const lang = getLang();
      const s = STRINGS[lang];
      const showRepair = (this.state.errorCount || 0) >= 2;

      return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-pink-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{s.title}</h1>

            <p className="text-gray-600 mb-6">{s.body}</p>

            {this.state.error && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                <p className="text-xs text-gray-500 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                {s.reload}
              </button>

              {showRepair && (
                <button
                  onClick={this.handleRepair}
                  disabled={this.state.isRecovering}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Wrench className="w-5 h-5" />
                  {this.state.isRecovering ? s.repairing : s.repair}
                </button>
              )}
            </div>

            {showRepair && (
              <p className="text-xs text-gray-400 mt-6">{s.repairHint}</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
