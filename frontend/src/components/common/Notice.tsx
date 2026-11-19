import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { BadgeTone } from './Badge';

export interface NoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Exclude<BadgeTone, 'neutral' | 'brand' | 'purple'>;
  title: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

const styles = {
  success: { box: 'border-success-line bg-success-bg text-success', icon: CheckCircle2 },
  warning: { box: 'border-warning-line bg-warning-bg text-warning', icon: AlertTriangle },
  danger: { box: 'border-danger-line bg-danger-bg text-danger', icon: AlertCircle },
  info: { box: 'border-info-line bg-info-bg text-info', icon: Info },
};

export const Notice: React.FC<NoticeProps> = ({ tone = 'info', title, action, onDismiss, className, children, ...props }) => {
  const Icon = styles[tone].icon;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={clsx('flex items-start gap-3 rounded-xl border p-4', styles[tone].box, className)} {...props}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm leading-relaxed opacity-90">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 rounded-md p-1 hover:bg-black/5" aria-label="Fermer la notification">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

