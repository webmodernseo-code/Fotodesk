import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/common';
import { useTranslation } from 'react-i18next';
import { SettingsSaveBar } from '../../../components/admin/SettingsSaveBar';
import { MfaSettingsCard } from '../components/MfaSettingsCard';
import type { SecuritySettings, RateLimitSettings } from '../hooks/useSettingsState';

interface SecurityTabProps {
  securitySettings: SecuritySettings;
  setSecuritySettings: React.Dispatch<React.SetStateAction<SecuritySettings>>;
  rateLimitSettings?: RateLimitSettings;
  setRateLimitSettings?: React.Dispatch<React.SetStateAction<RateLimitSettings>>;
  saveSecurityMutation: {
    mutate: () => void;
    isPending: boolean;
  };
  isDirty: boolean;
  onDiscard: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  securitySettings,
  setSecuritySettings,
  saveSecurityMutation,
  isDirty,
  onDiscard,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <MfaSettingsCard />

      <Card padding="md">
        <h2 className="text-lg font-semibold text-heading mb-4">{t('settings.security.galleryPasswordsTitle')}</h2>

        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={securitySettings.gallery_password_recoverable}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, gallery_password_recoverable: e.target.checked }))}
              className="w-4 h-4 mt-0.5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-body">
              <span className="block font-medium text-heading">{t('settings.security.galleryPasswordRecoverable')}</span>
              <span className="block mt-1">{t('settings.security.galleryPasswordRecoverableHelp')}</span>
            </span>
          </label>

          {/* #1271 — reversible storage is a deliberate trade of security for
              convenience; the warning stays visible whether or not it is on. */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <p className="font-medium">{t('settings.security.galleryPasswordRecoverableWarningTitle')}</p>
                <p>{t('settings.security.galleryPasswordRecoverableWarning')}</p>
                <p>{t('settings.security.galleryPasswordRecoverableOffNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={saveSecurityMutation.isPending}
        onSave={() => saveSecurityMutation.mutate()}
        onDiscard={onDiscard}
      />
    </div>
  );
};
