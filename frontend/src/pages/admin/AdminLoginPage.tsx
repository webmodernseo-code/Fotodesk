import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../../contexts';
import { AuthUI } from '@/components/ui/auth-fuse';
import { useTranslation } from 'react-i18next';
import { usePublicSettings } from '../../hooks/usePublicSettings';

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, user } = useAdminAuth();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { data: settings } = usePublicSettings();
  const supportEmail = settings?.branding_support_email?.trim();

  if (isAuthenticated) {
    const roleName = typeof user?.role === 'object' ? (user.role as any)?.name : user?.role;
    const target =
      roleName === 'super_admin' || searchParams.get('role') === 'superadmin'
        ? '/superadmin'
        : '/admin/dashboard';
    return <Navigate to={target} replace />;
  }

  return <div className="fd-auth relative"><AuthUI />{supportEmail && (
    <p className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 text-xs text-muted">
      {t('adminLogin.needHelp', 'Besoin d’aide ?')}{' '}
      <a className="font-medium text-heading hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
    </p>
  )}</div>;
};

export default AdminLoginPage;
