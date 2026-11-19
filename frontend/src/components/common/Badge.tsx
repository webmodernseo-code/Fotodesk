import React from 'react';
import { clsx } from 'clsx';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'border-line-strong bg-subtle text-body',
  brand: 'border-brand-line bg-brand-soft text-brand',
  success: 'border-success-line bg-success-bg text-success',
  warning: 'border-warning-line bg-warning-bg text-warning',
  danger: 'border-danger-line bg-danger-bg text-danger',
  info: 'border-info-line bg-info-bg text-info',
  purple: 'border-purple-line bg-purple-bg text-purple',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot = false, className, children, ...props }) => (
  <span
    className={clsx(
      'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
      tones[tone],
      className,
    )}
    {...props}
  >
    {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
    <span className="truncate">{children}</span>
  </span>
);

