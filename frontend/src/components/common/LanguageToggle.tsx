import React from 'react';
import { useTranslation } from 'react-i18next';

// 100% SVG Vector Flags with millimetric alignment (Anti-AI Slop & Zero Emoji)
export const FranceFlagSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg
    viewBox="0 0 640 480"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    role="img"
  >
    <path fill="#002395" d="M0 0h213.3v480H0z" />
    <path fill="#ffffff" d="M213.3 0h213.4v480H213.3z" />
    <path fill="#ED2939" d="M426.7 0H640v480H426.7z" />
  </svg>
);

export const UKFlagSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg
    viewBox="0 0 640 480"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    role="img"
  >
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path
      fill="#ffffff"
      d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"
    />
    <path
      fill="#C8102E"
      d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
    />
    <path fill="#ffffff" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
  </svg>
);

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  theme?: 'auto' | 'dark' | 'light';
}

/**
 * Premium SaaS Segmented Language Selector (FR / EN)
 * Features 100% vector SVG flags, tactile segmented pill, and instant 1-click switching.
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  size = 'md',
  theme = 'auto',
}) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'fr').toLowerCase().split('-')[0];
  const isFrench = currentLang === 'fr';

  const handleSelect = (code: 'fr' | 'en') => {
    if (currentLang !== code) {
      i18n.changeLanguage(code);
    }
  };

  const isSmall = size === 'sm';
  const isDarkTheme = theme === 'dark';

  const containerClasses = isDarkTheme
    ? 'border border-white/10 bg-white/[0.04] text-neutral-200'
    : 'border border-neutral-200/80 dark:border-white/10 bg-neutral-100/90 dark:bg-white/[0.04] text-body';

  const getButtonClasses = (active: boolean) => {
    const pad = isSmall ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs';
    if (isDarkTheme) {
      return active
        ? `${pad} bg-white text-black font-bold shadow-xs`
        : `${pad} text-neutral-400 hover:text-white font-medium`;
    }
    return active
      ? `${pad} bg-panel text-neutral-900 dark:text-black font-bold shadow-xs`
      : `${pad} text-muted hover:text-heading font-medium`;
  };

  return (
    <div
      role="group"
      aria-label="Sélecteur de langue / Language selector"
      className={`inline-flex items-center p-0.5 rounded-full shadow-2xs transition-colors ${containerClasses} ${className}`}
    >
      {/* Option Français */}
      <button
        type="button"
        onClick={() => handleSelect('fr')}
        aria-pressed={isFrench}
        aria-label="Passer en Français"
        title="Passer en Français"
        className={`inline-flex items-center gap-1.5 rounded-full tracking-tight transition-all duration-150 select-none cursor-pointer ${getButtonClasses(
          isFrench
        )}`}
      >
        <span className="overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/15 shrink-0 inline-flex shadow-2xs">
          <FranceFlagSvg className={isSmall ? 'w-3.5 h-2.5' : 'w-4 h-3'} />
        </span>
        <span>FR</span>
      </button>

      {/* Option English */}
      <button
        type="button"
        onClick={() => handleSelect('en')}
        aria-pressed={!isFrench}
        aria-label="Switch to English"
        title="Switch to English"
        className={`inline-flex items-center gap-1.5 rounded-full tracking-tight transition-all duration-150 select-none cursor-pointer ${getButtonClasses(
          !isFrench
        )}`}
      >
        <span className="overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/15 shrink-0 inline-flex shadow-2xs">
          <UKFlagSvg className={isSmall ? 'w-3.5 h-2.5' : 'w-4 h-3'} />
        </span>
        <span>EN</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
