import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, ChevronDown } from 'lucide-react';
import { clearStoredAdminSession } from '../utils/sessionHelper';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkLoadError: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkLoadError: false,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkLoadError =
      error.message?.includes('dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch') ||
      error.name === 'ChunkLoadError';

    return {
      hasError: true,
      error,
      isChunkLoadError,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    clearStoredAdminSession();
    window.location.hash = '';
    window.location.search = '';
    if (window.location.pathname.toLowerCase().includes('admin') || window.location.pathname.toLowerCase().includes('dashboard')) {
      window.history.pushState(null, '', '/');
    }
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
    window.location.search = '';
    if (window.location.pathname.toLowerCase().includes('admin') || window.location.pathname.toLowerCase().includes('dashboard')) {
      window.history.pushState(null, '', '/');
    }
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const { error, isChunkLoadError, showDetails } = this.state;
      const title = this.props.fallbackTitle || 'Terjadi Kendala Memuat Modul';

      return (
        <div
          id="error-boundary-container"
          className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-amber-400 selection:text-slate-950 relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div
            id="error-boundary-card"
            className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center"
          >
            {/* Icon */}
            <div
              id="error-boundary-icon-box"
              className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-lg shadow-amber-400/10"
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Badge */}
            <span
              id="error-boundary-badge"
              className="text-[11px] uppercase tracking-widest font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full"
            >
              {isChunkLoadError ? 'Pembaruan Versi Tersedia' : 'Pusat Pemulihan Sistem'}
            </span>

            {/* Title & Description */}
            <h2
              id="error-boundary-heading"
              className="font-serif-luxury text-xl sm:text-2xl font-bold text-slate-100 mt-3"
            >
              {isChunkLoadError ? 'Versi Baru Aplikasi Terdeteksi' : title}
            </h2>
            <p id="error-boundary-desc" className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              {isChunkLoadError
                ? 'Halaman memerlukan pembaruan cache untuk memuat aset versi terbaru. Silakan klik tombol Muat Ulang di bawah.'
                : 'Aplikasi mengalami kendala saat merender komponen. Sistem pencegah layar blank telah mengamankan tampilan agar Anda dapat memulihkan sesi.'}
            </p>

            {/* Actions */}
            <div id="error-boundary-actions" className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-error-reload"
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                id="btn-error-home"
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>

            {/* Reset Session Option for Admin Issues */}
            <div id="error-boundary-secondary-action" className="mt-4 pt-4 border-t border-slate-800/80">
              <button
                id="btn-error-reset-session"
                type="button"
                onClick={this.handleResetSession}
                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Reset Sesi Login & Masuk Ulang</span>
              </button>
            </div>

            {/* Collapsible Error Details for Troubleshooting */}
            {error && (
              <div id="error-boundary-details-box" className="mt-4 text-left">
                <button
                  id="btn-error-toggle-details"
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="w-full text-[10px] text-slate-500 hover:text-slate-400 flex items-center justify-between py-1 font-mono transition-colors cursor-pointer"
                >
                  <span>Detail Diagnostik Sistem</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>

                {showDetails && (
                  <pre
                    id="error-boundary-pre"
                    className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-rose-300 overflow-x-auto max-h-36 leading-relaxed"
                  >
                    {error.name}: {error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
