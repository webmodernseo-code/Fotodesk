/**
 * Customer login page (#354).
 *
 * Mounted at /customer/login. Strictly separate from /admin/login —
 * different auth context, different cookie, different backend route.
 */
import React, { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { Button, Input, Card, ReCaptcha, PoweredBy } from '../../components/common';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { customerService } from '../../services/customer.service';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { usePublicDarkMode } from '../../hooks/usePublicDarkMode';
import { resolveLoginLogoClasses } from '../../utils/loginLogoSize';

/**
 * Where to go after login. Only paths inside the authenticated customer
 * surface are followed — never another origin (`//host`, `/\host`) and never
 * back to the public login / invite / reset pages. The target page re-checks
 * access on its own, so this only decides where to land.
 */
export function safeCustomerReturnTo(value: string | null): string {
  const fallback = '/customer/dashboard';
  if (!value || !value.startsWith('/customer/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  if (/^\/customer\/(login|invite|reset-password)(\/|\?|$)/.test(value)) return fallback;
  return value;
}

export const CustomerLoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, setSession } = useCustomerAuth();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const { data: settingsData } = usePublicSettings();
  // Customer surface follows branding_force_color_mode (+ OS fallback); isDark
  // drives the theme-aware logo pick. A framed logo sits on a fixed cream
  // plate (see render), so the light (dark-ink) logo always reads there;
  // only the frameless logo sits on the themed (possibly dark) page bg.
  const { isDark } = usePublicDarkMode();
  const companyName = settingsData?.branding_company_name?.trim() || 'FotoDesk';
  const lightLogo = settingsData?.branding_logo_url?.trim();
  const darkLogo = settingsData?.branding_logo_url_dark?.trim();
  const loginFrameEnabled = settingsData?.branding_login_logo_frame_enabled !== false;
  const themedLogo = isDark ? (darkLogo || lightLogo) : (lightLogo || darkLogo);
  const logoUrl = loginFrameEnabled ? (lightLogo || darkLogo) : themedLogo;
  const resolvedLogoUrl = logoUrl || '/logo.png';

  // After /accept-invite the user is redirected here with ?accepted=1
  // so we can show a friendly success toast on first paint.
  React.useEffect(() => {
    if (searchParams.get('accepted') === '1') {
      toast.success(t('customer.login.acceptedToast', 'Account ready — please log in.'));
    }
  }, [searchParams, t]);

  if (isAuthenticated) {
    return <Navigate to={safeCustomerReturnTo(searchParams.get('returnTo'))} replace />;
  }

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.email) {
      next.email = t('customer.login.emailRequired', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = t('customer.login.invalidEmail', 'Please enter a valid email');
    }
    if (!formData.password) {
      next.password = t('customer.login.passwordRequired', 'Password is required');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const response = await customerService.login(
        formData.email,
        formData.password,
        recaptchaToken
      );
      // Apply the full session payload (customer + features + branding)
      // so the dashboard's first paint shows the correct sidebar. Using
      // setCustomer alone left features at DEFAULT_FEATURES (all false)
      // until the next CustomerAuthProvider remount, which is why the
      // Soon menus only appeared after navigating to a gallery and back.
      setSession(response);
      toast.success(t('customer.login.loginSuccess', 'Welcome back!'));
      // Navigate via Navigate component on next render — setCustomer
      // flips isAuthenticated true so the redirect at the top fires.
    } catch (error: any) {
      if (error.response?.status === 429 || error.response?.status === 423) {
        toast.error(t('customer.login.tooManyAttempts', 'Too many attempts — please try again later.'));
      } else if (error.response?.status === 401) {
        setErrors({ form: t('customer.login.invalidCredentials', 'Invalid email or password') });
      } else if (error.code === 'ERR_NETWORK') {
        toast.error(t('customer.login.networkError', 'Could not reach the server. Please try again.'));
      } else {
        toast.error(t('customer.login.generalError', 'Login failed. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

  return (
    <div
      className="customer-surface min-h-screen flex items-center justify-center p-4 bg-[#090A0C] text-white selection:bg-[#C89561] selection:text-white"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block transition-transform hover:scale-105 mb-3">
            <img
              src="/logo.png"
              alt="FotoDesk"
              className="h-10 w-auto object-contain mx-auto drop-shadow-[0_2px_12px_rgba(200,149,97,0.3)]"
            />
          </a>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#C89561]/15 text-[#E8BFA1] border border-[#C89561]/30 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C89561] animate-pulse" />
            Espace Client
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t('customer.login.title', 'Connexion Client')}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            {t('customer.login.subtitle', 'Accédez à toutes vos galeries photos au même endroit.')}
          </p>
        </div>

        <Card padding="lg" className="bg-[#10141A] border border-white/[0.08] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-lg border"
                style={{
                  borderColor: 'var(--color-surface-border, #e5e5e5)',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-elevated, rgba(220, 38, 38, 0.05))',
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-status hue-danger" />
                <span className="text-sm">{errors.form}</span>
              </div>
            )}

            <div>
              <label htmlFor="customer-email" className="block text-sm font-medium text-theme mb-1">
                {t('customer.login.email', 'Email')}
              </label>
              <Input
                id="customer-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                placeholder={t('customer.login.emailPlaceholder', 'you@example.com')}
                leftIcon={<Mail className="w-5 h-5 text-neutral-400" />}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="customer-password" className="block text-sm font-medium text-theme mb-1">
                {t('customer.login.password', 'Password')}
              </label>
              <div className="relative">
                <Input
                  id="customer-password"
                  name="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  placeholder={t('customer.login.passwordPlaceholder', 'Your password')}
                  leftIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword
                    ? t('customer.login.hidePassword', 'Hide password')
                    : t('customer.login.showPassword', 'Show password')}
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5" />
                    : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <ReCaptcha
              onChange={setRecaptchaToken}
              onExpired={() => setRecaptchaToken(null)}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-[#C89561] hover:bg-[#B5824E] active:bg-[#96693E] text-white font-medium shadow-[0_4px_16px_rgba(200,149,97,0.3)] hover:shadow-[0_6px_22px_rgba(200,149,97,0.45)] cursor-pointer"
            >
              {t('customer.login.signIn', 'Se connecter')}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          {settingsData?.branding_support_email && (
            <p className="text-sm text-neutral-400">
              {t('customer.login.needHelp', 'Besoin d\'aide ?')}{' '}
              <a
                href={`mailto:${settingsData.branding_support_email}`}
                className="text-[#C89561] hover:text-[#E8BFA1] hover:underline"
              >
                {settingsData.branding_support_email}
              </a>
            </p>
          )}
          <PoweredBy className="text-xs mt-2 text-neutral-500" />
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
