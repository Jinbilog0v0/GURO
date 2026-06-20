import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 items-center justify-center p-10">
          <div className="glass-panel max-w-md w-full p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--danger-glow)] border border-[var(--danger)]/30 flex items-center justify-center">
              <AlertTriangle className="size-7 text-[var(--danger)]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--text-main)] tracking-tight">Something went wrong</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                An unexpected error occurred in this workspace. Your data is safe.
              </p>
              {this.state.error && (
                <p className="mt-3 text-[11px] font-mono text-[var(--danger)] bg-[var(--danger-glow)] border border-[var(--danger)]/20 rounded-lg px-3 py-2 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn btn-primary flex items-center gap-2"
            >
              <RotateCw className="size-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
