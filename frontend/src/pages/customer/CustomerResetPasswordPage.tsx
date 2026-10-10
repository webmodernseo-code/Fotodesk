/**
 * Customer password reset (#354 follow-up).
 *
 * Mounted at /customer/reset-password/:token. Public route — anyone with
 * the link can complete the reset. The token IS the auth: 256 bits of
 * entropy, single-use, 7-day TTL, server-side validated; the existing
 * password keeps working until this page successfully POSTs a new one.
 *
 * Mirrors CustomerAcceptInvitePage's chrome (logo + branded background)
 * for visual consistency with the rest of the customer surface.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { Button, Input, Card, Loading } from '../../components/common';
import { customerService } from '../../services/customer.service';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { usePublicDarkMode } from '../../hooks/usePublicDarkMode';

export const CustomerResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token = '' } = useParams<{ token: string }>();

  const [reset, setReset] = useState<{ email: string; expiresAt: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(true);

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: settingsData } = usePublicSettings();
  // Theme-aware logo: page renders on the themed customer surface (dark when
  // branding_force_color_mode is dark / OS dark). No frame — logo sits on the
  // page bg, so pick the dark variant when dark.
  const { isDark } = usePublicDarkMode();
  const companyName = settingsData?.branding_company_name?.trim() || 'FotoDesk';
  const lightLogo = settingsData?.branding_logo_url?.trim();
  const darkLogo = settingsData?.branding_logo_url_dark?.trim();
  const logoUrl = isDark ? (darkLogo || lightLogo) : (lightLogo || darkLogo);
  const resolvedLogoUrl = logoUrl || '/logo.png';

  // Pre-flight token validation. Same pattern as the invite page — if the
  // token is invalid we render an error state instead of a useless form.
  useEffect(() => {
    let cancelled = false;
    setIsLookingUp(true);
    customerService.getPasswordReset(token)
      .then((info) => {
        if (cancelled) return;
        setReset(info);
      })
      .catch(() => {
        if (cancelled) return;
        setLookupError(t(
          'customer.resetPassword.invalidToken',
          'This reset link is invalid or has expired. Please ask your photographer to send a new one.'
        ));
      })
      .finally(() => {
        if (!cancelled) setIsLookingUp(false);
      });
    return () => { cancelled = true; };
  }, [token, t]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.password.length < 8) {
      next.password = t('customer.resetPassword.tooShort', 'Password must be at least 8 characters');
    }
    if (form.password !== form.confirm) {
      next.confirm = t('customer.resetPassword.mismatch', 'Passwords do not match');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await customerService.applyPasswordReset(token, form.password);
      toast.success(t('customer.resetPassword.successToast', 'Password updated. Please log in.'));
      navigate('/customer/login?reset=1', { replace: true });
    } catch (error: any) {
      if (error.response?.data?.details?.length) {
        setErrors({ password: error.response.data.details.join(' ') });
      } else if (error.response?.status === 400) {
        setErrors({ form: error.response?.data?.error || t('customer.resetPassword.invalidSubmission', 'Could not update your password.') });
      } else {
        toast.error(t('customer.resetPassword.generalError', 'Could not update your password. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="customer-surface min-h-screen flex items-center justify-center px-4 py-8 bg-[#090A0C] text-white selection:bg-[#C89561] selection:text-white"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block transition-transform hover:scale-105 mb-4">
            <img
              src="/logo.png"
              alt="FotoDesk"
              className="h-10 w-auto object-contain mx-auto filter drop-shadow-sm"
            />
          </a>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-neutral-400 bg-white/[0.04] border border-white/[0.08] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Espace Client
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t('customer.resetPassword.title', 'Réinitialisation du mot de passe')}
          </h1>
        </div>

        <Card padding="lg" className="bg-[#10141A] border border-white/[0.08] shadow-2xl">
          {isLookingUp ? (
            <div className="flex justify-center py-8"><Loading size="lg" /></div>
          ) : lookupError || !reset ? (
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-status hue-danger" />
              <p className="text-theme">{lookupError}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-neutral-400" />
                <div className="text-sm text-neutral-300">
                  {t('customer.resetPassword.forEmail', 'Setting a new password for ')}
                  <span className="font-medium text-white">{reset.email}</span>
                  {'.'}
                </div>
              </div>

              {errors.form && (
                <div role="alert" className="flex items-start gap-2 p-3 rounded-lg border" style={{ borderColor: 'var(--color-surface-border)' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-status hue-danger" />
                  <span className="text-sm text-theme">{errors.form}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  {t('customer.resetPassword.password', 'New password')}
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  error={errors.password}
                  leftIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                  autoComplete="new-password"
                  autoFocus
                />
                <p className="mt-1 text-xs text-muted-theme">
                  {t('customer.resetPassword.hint', 'At least 8 characters with one uppercase letter and one number.')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  {t('customer.resetPassword.confirm', 'Confirm new password')}
                </label>
                <Input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                  error={errors.confirm}
                  leftIcon={<Lock className="w-5 h-5 text-neutral-400" />}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="w-full bg-[#C89561] hover:bg-[#B5824E] active:bg-[#96693E] text-white font-medium shadow-[0_4px_16px_rgba(200,149,97,0.3)] hover:shadow-[0_6px_22px_rgba(200,149,97,0.45)] cursor-pointer"
              >
                {t('customer.resetPassword.submit', 'Mettre à jour le mot de passe')}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CustomerResetPasswordPage;
