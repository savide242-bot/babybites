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
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isRecovering: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isRecovering: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRepair = async () => {
    this.setState({ isRecovering: true });
    await performPWARecovery();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-pink-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              The app encountered an error. This sometimes happens after updates. 
              Try reloading, or repair the app to clear cached data.
            </p>
            
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
                Reload App
              </button>
              
              <button
                onClick={this.handleRepair}
                disabled={this.state.isRecovering}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
              >
                <Wrench className="w-5 h-5" />
                {this.state.isRecovering ? 'Repairing...' : 'Repair App'}
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-6">
              Repair clears cached data and may fix loading issues.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
