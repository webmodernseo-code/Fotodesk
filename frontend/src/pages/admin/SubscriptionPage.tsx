import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  Check,
  CreditCard,
  FileText,
  HardDrive,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { fotodeskService } from '../../services/fotodesk.service';
import { businessProfileService } from '../../services/businessProfile.service';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';

type SubTab = 'overview' | 'plans' | 'history' | 'usage' | 'billingInfo';

interface SubInvoiceRow {
  id: number;
  invoice_number: string;
  plan_id: string;
  billing_interval: string;
  amount_minor: number;
  currency: string;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
}

interface SubscriptionResponse {
  studio: {
    id: number;
    name: string;
    planId: string;
    status: string;
    isPro: boolean;
  };
  quotas: {
    storageBytes: number;
    storageLimitBytes: number | null;
    galleriesCount: number;
    galleriesLimit: number | null;
    clientsCount: number;
    clientsLimit: number | null;
  };
  invoices: SubInvoiceRow[];
}

function formatEur(minor: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format((minor || 0) / 100);
}

function formatGb(bytes: number): string {
  const gb = (bytes || 0) / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} Go`;
}

export const SubscriptionPage: React.FC = () => {
  const { format: formatDate } = useLocalizedDate();
  const [searchParams] = useSearchParams();
  const checkoutState = searchParams.get('checkout');

  const [activeTab, setActiveTab] = useState<SubTab>('overview');

  const { data, isLoading, isError, refetch } = useQuery<SubscriptionResponse>({
    queryKey: ['admin-subscription'],
    queryFn: () => fotodeskService.subscription.get(),
  });

  const { data: bpData } = useQuery({
    queryKey: ['business-profile-subscription'],
    queryFn: () => businessProfileService.get(),
    staleTime: 60_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => fotodeskService.subscription.createCheckout('pro_monthly'),
    onSuccess: (res: any) => {
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      if (res?.mode === 'local_simulation') {
        toast.info(
          'Mode local sans clé Stripe : configurez STRIPE_SECRET_KEY pour tester le paiement réel.',
        );
        return;
      }
      toast.error('URL de paiement Stripe non reçue.');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          'Le paiement des abonnements est actuellement indisponible.',
      );
    },
  });

  const studio = data?.studio;
  const quotas = data?.quotas;
  const invoices = data?.invoices ?? [];
  const profile = bpData?.profile;
  const isPro = Boolean(studio?.isPro);

  const storagePct = useMemo(() => {
    if (!quotas?.storageLimitBytes) return 0;
    return Math.min(100, Math.round((quotas.storageBytes / quotas.storageLimitBytes) * 100));
  }, [quotas]);

  const galleriesPct = useMemo(() => {
    if (!quotas?.galleriesLimit) return 0;
    return Math.min(100, Math.round((quotas.galleriesCount / quotas.galleriesLimit) * 100));
  }, [quotas]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Studio <span className="mx-1">/</span> Abonnement
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            Abonnement & Facturation
          </h1>
          <p className="text-sm text-muted mt-1">
            Gérez votre offre FotoDesk, votre stockage et vos factures d&apos;abonnement.
          </p>
        </div>

        {!isPro && !isLoading && !isError && (
          <button
            type="button"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {checkoutMutation.isPending ? 'Redirection…' : 'Passer à Premium (6,99 €/mois)'}
            </span>
          </button>
        )}
      </div>

      {checkoutState === 'success' && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>
            Paiement enregistré. Votre offre est mise à jour dès réception de la confirmation Stripe.
          </span>
        </div>
      )}

      {checkoutState === 'cancel' && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Le paiement a été annulé. Aucune modification n&apos;a été appliquée à votre abonnement.
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="rounded-2xl border border-line bg-panel p-1.5 shadow-2xs flex flex-wrap gap-1">
        {[
          { key: 'overview' as const, label: 'Aperçu' },
          { key: 'plans' as const, label: 'Offres & Tarifs' },
          { key: 'history' as const, label: `Historique (${invoices.length})` },
          { key: 'usage' as const, label: 'Utilisation & Stockage' },
          { key: 'billingInfo' as const, label: 'Coordonnées' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-neutral-950 border border-neutral-200/80 shadow-xs dark:bg-neutral-800 dark:text-white dark:border-white/10'
                  : 'text-muted hover:text-heading hover:bg-hover/70 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {isLoading ? (
        <div className="bg-panel border border-line rounded-2xl p-10 text-center text-sm text-muted">
          Chargement de l&apos;abonnement…
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="bg-panel border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-heading">
                Impossible de charger les informations d&apos;abonnement
              </p>
              <p className="text-xs text-muted mt-0.5">
                Vérifiez votre connexion et réessayez.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel hover:bg-hover px-4 py-2 text-xs font-semibold text-heading cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted">Offre actuelle</p>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {isPro ? 'Premium' : 'Starter'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-heading">
                  {isPro ? '6,99 € / mois' : '0 € / mois'}
                </p>
                <p className="text-xs text-muted">
                  Studio : <span className="font-medium text-heading">{studio?.name}</span>
                </p>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted">Stockage utilisé</p>
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-heading">
                  {formatGb(quotas?.storageBytes ?? 0)}{' '}
                  <span className="text-sm font-normal text-muted">
                    /{' '}
                    {quotas?.storageLimitBytes
                      ? formatGb(quotas.storageLimitBytes)
                      : 'Illimité'}
                  </span>
                </p>
                <div className="h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PLANS */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-panel border border-line rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-heading">Starter</h2>
                  {!isPro && (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-medium">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-heading">
                  0 € <span className="text-sm font-normal text-muted">/ mois</span>
                </p>
                <ul className="space-y-2 text-sm text-body">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3 Go de stockage photo & vidéo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Jusqu&apos;à 5 galeries actives</span>
                  </li>
                </ul>
              </div>

              <div className="bg-panel border border-emerald-500/40 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-heading">Premium</h2>
                  {isPro && (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-medium">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-heading">
                  6,99 € <span className="text-sm font-normal text-muted">/ mois</span>
                </p>
                <ul className="space-y-2 text-sm text-body">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100 Go de stockage photo & vidéo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Galeries et clients illimités</span>
                  </li>
                </ul>
                {!isPro && (
                  <button
                    type="button"
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {checkoutMutation.isPending ? 'Redirection…' : 'Passer à Premium'}
                    </span>
                  </button>
                )}
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Paiement sécurisé par Stripe · Sans engagement</span>
                </p>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-panel border border-line rounded-2xl overflow-hidden shadow-2xs">
              {invoices.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <FileText className="w-7 h-7 text-muted mx-auto opacity-60" />
                  <p className="text-sm font-semibold text-heading">
                    Aucune facture d&apos;abonnement
                  </p>
                  <p className="text-xs text-muted">
                    Vos factures apparaîtront ici dès votre premier paiement confirmé.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-heading">{inv.invoice_number}</p>
                        <p className="text-xs text-muted">
                          {inv.plan_id === 'pro_monthly' ? 'Premium Mensuel' : inv.plan_id} ·{' '}
                          {inv.issued_at ? formatDate(inv.issued_at) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-heading">
                          {formatEur(inv.amount_minor, inv.currency)}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {inv.status === 'paid' ? 'Payée' : inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USAGE */}
          {activeTab === 'usage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-heading">Stockage média</span>
                  <span className="text-muted">
                    {formatGb(quotas?.storageBytes ?? 0)} /{' '}
                    {quotas?.storageLimitBytes ? formatGb(quotas.storageLimitBytes) : 'Illimité'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                    style={{ width: `${storagePct}%` }}
                  />
                </div>
              </div>

              <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-heading">Galeries</span>
                  <span className="text-muted">
                    {quotas?.galleriesCount ?? 0} / {quotas?.galleriesLimit ?? 'Illimité'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                    style={{ width: `${galleriesPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BILLING INFO */}
          {activeTab === 'billingInfo' && (
            <div className="bg-panel border border-line rounded-2xl p-5 shadow-2xs space-y-3">
              <h2 className="text-sm font-semibold text-heading">
                Coordonnées de facturation du studio
              </h2>
              {profile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Raison sociale</p>
                    <p className="font-medium text-heading">{profile.companyName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">E-mail</p>
                    <p className="font-medium text-heading">{profile.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Adresse</p>
                    <p className="font-medium text-heading">
                      {[profile.addressLine1, profile.postalCode, profile.city]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">N° TVA</p>
                    <p className="font-medium text-heading">{profile.vatId || '—'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Renseignez vos coordonnées dans Paramètres → Profil du studio.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
