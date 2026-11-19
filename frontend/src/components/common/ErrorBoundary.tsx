import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw, Home, ShieldCheck } from 'lucide-react';
import { NotFoundPage } from '../../pages/public/NotFoundPage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

const isNotFoundError = (error: Error | null): boolean => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('introuvable') ||
    msg.includes('cannot find') ||
    name.includes('notfound') ||
    (error as unknown as { status?: number }).status === 404 ||
    (error as unknown as { statusCode?: number }).statusCode === 404
  );
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    if (errorInfo?.componentStack) {
      this.setState({ componentStack: errorInfo.componentStack });
    }
    try {
      fetch('/api/public/settings/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || String(error),
          stack: error?.stack || null,
          componentStack: errorInfo?.componentStack || null,
          url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      }).catch(() => {});
    } catch {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Si l'erreur est un 404 ou que l'URL est /404, afficher directement la page 404
      if (isNotFoundError(this.state.error) || (typeof window !== 'undefined' && window.location.pathname === '/404')) {
        return <NotFoundPage />;
      }

      // Sinon, afficher la page d'erreur 500 ultra-premium
      return (
        <div className="min-h-screen w-full bg-[#09090b] text-neutral-100 flex flex-col items-center justify-center p-4 selection:bg-[#c89561]/30 selection:text-white relative overflow-hidden font-sans">
          {/* Subtle Background Glow */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[160px]" />
          <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#c89561]/5 blur-[120px]" />

          <div className="relative z-10 max-w-lg w-full text-center px-6 py-12 flex flex-col items-center">
            {/* FotoDesk Logo */}
            <a href="/" className="inline-flex items-center gap-2 mb-6 group opacity-90 hover:opacity-100 transition-opacity">
              <img 
                src="/logo.png" 
                alt="FotoDesk" 
                className="h-8 w-auto object-contain filter brightness-0 invert" 
              />
              <span className="text-xl font-bold tracking-tight text-white">Foto<span className="font-light text-neutral-400">Desk</span></span>
            </a>

            {/* Error Code */}
            <h1 className="text-8xl sm:text-9xl font-extrabold tracking-tighter text-white select-none leading-none mb-3">
              500
            </h1>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Une erreur inattendue est survenue
            </h2>

            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-md mx-auto mb-8">
              Nous avons rencontré un imprévu temporaire. Rassurez-vous, toutes vos galeries et données restent sécurisées.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-neutral-200 hover:bg-white text-neutral-950 font-semibold text-sm transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </a>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 hover:text-white font-medium text-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-neutral-400" />
                <span>Recharger la page</span>
              </button>
            </div>

            {this.state.error && (
              <details open={import.meta.env.DEV} className="mt-8 text-left border-t border-neutral-800 pt-4 w-full max-w-md">
                <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300">
                  Détails techniques de l'erreur
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-[11px] text-neutral-400 font-mono">
                  {this.state.error.message}
                  {this.state.componentStack ? `\n\nComponent stack:${this.state.componentStack}` : ''}
                  {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                </pre>
              </details>
            )}

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c89561]" />
              <span>Données chiffrées & protégées · FotoDesk</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// PageErrorBoundary hérite du même comportement ultra-premium sans jamais afficher l'ancienne carte blanche
export class PageErrorBoundary extends ErrorBoundary {}
