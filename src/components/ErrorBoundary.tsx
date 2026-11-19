import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let displayMsg = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error && parsed.operationType) {
        displayMsg = `Database permission error during ${parsed.operationType} on ${parsed.path || 'record'}: ${parsed.error}`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: displayMsg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
