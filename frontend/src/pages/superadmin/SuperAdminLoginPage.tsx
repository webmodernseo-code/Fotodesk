import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Moon, ShieldCheck, Sun } from 'lucide-react';
import { toast } from 'react-toastify';
import { FotoDeskLogo } from '@/components/common/FotoDeskLogo';
import { useAdminAuth } from '@/contexts';
import { useAdminDarkMode } from '@/contexts/AdminDarkModeContext';
import { authService } from '@/services/auth.service';
import { isMfaChallenge } from '@/types';

export const SuperAdminLoginPage: React.FC = () => {
  const { isAuthenticated, user, login } = useAdminAuth();
  const { isDark, toggle: toggleDarkMode } = useAdminDarkMode();
  const navigate = useNavigate();

  const [email, setEmail] = useState('founder@fotodesk.com');
  const [password, setPassword] = useState('admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const roleName = typeof user?.role === 'object' ? (user.role as any)?.name : user?.role;
  if (isAuthenticated && roleName === 'super_admin') {
    return <Navigate to="/superadmin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const response = await authService.adminLogin({ email, password });
      if (isMfaChallenge(response)) {
        toast.info('Validation supplémentaire requise.');
      } else if (response.user) {
        const resRole =
          typeof response.user.role === 'object'
            ? (response.user.role as any)?.name
            : response.user.role;
        if (resRole !== 'super_admin') {
          const msg = "Ce compte ne dispose pas des droits Super Admin.";
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }
        login((response as any).token || '', response.user);
        toast.success('Connexion Super Admin réussie.');
        navigate('/superadmin', { replace: true });
      } else {
        const msg = 'Échec de connexion. Vérifiez vos identifiants.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || 'Erreur de connexion au serveur FotoDesk';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-heading font-sans flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-heading transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à FotoDesk
        </Link>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl border border-line bg-panel hover:bg-hover flex items-center justify-center text-soft hover:text-heading transition-colors cursor-pointer"
          aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Centered Card */}
      <div className="w-full max-w-[440px] mx-auto my-8">
        <div className="bg-panel border border-line rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center shadow-sm">
              <FotoDeskLogo size={24} />
            </div>

            <span className="badge-info px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Console Fondateur · Super Admin
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-heading">
              Connexion Super Admin
            </h1>
            <p className="text-xs text-muted max-w-xs">
              Accès réservé à l&apos;administration globale de la plateforme FotoDesk.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-muted px-0.5">
              <span>Identifiant administrateur</span>
              <span className="badge-success text-[11px] py-0 px-2">Pré-rempli</span>
            </div>

            <div>
              <label htmlFor="sa-email" className="block text-xs font-semibold text-heading mb-1.5">
                Adresse e-mail
              </label>
              <input
                id="sa-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-neutral-400/40 focus:border-neutral-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="sa-password" className="block text-xs font-semibold text-heading mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="sa-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 pl-3.5 pr-11 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-neutral-400/40 focus:border-neutral-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className="banner-danger font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full h-11 rounded-xl text-sm font-semibold justify-center"
            >
              <Lock className="w-4 h-4" />
              {isLoading ? 'Connexion en cours...' : 'Accéder à la console Super Admin'}
            </button>
          </form>

          <div className="pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
            <Link to="/admin/login" className="hover:text-heading transition-colors">
              Connexion Studio →
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--sem-success-fg)' }} />
              SSL 256-bit certifié
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted">
        FotoDesk Super Admin · Accès restreint
      </p>
    </div>
  );
};

export default SuperAdminLoginPage;

