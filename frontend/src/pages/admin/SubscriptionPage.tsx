import React, { useEffect, useMemo, useState } from 'react';
import { fotodeskService } from '../../services/fotodesk.service';
import { toast } from 'react-toastify';
import {
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  Pencil,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

import { Badge, Button, Input } from '../../components/common';

type SubTab = 'overview' | 'plans' | 'history' | 'usage' | 'billingInfo' | 'manage';
type BillingCycle = 'monthly' | 'yearly';

interface MockSubInvoice {
  id: string;
  date: string;
  dateFilter: string;
  plan: string;
  cycle: 'Mensuel' | 'Annuel';
  period: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

const MOCK_INVOICES: MockSubInvoice[] = [
  {
    id: 'INV-2026-001',
    date: '1 nov. 2026',
    dateFilter: '2026-11',
    plan: 'Pro',
    cycle: 'Mensuel',
    period: '1 nov. – 30 nov. 2026',
    amount: '€9.90',
    status: 'Paid',
  },
  {
    id: 'INV-2026-002',
    date: '1 oct. 2026',
    dateFilter: '2026-10',
    plan: 'Pro',
    cycle: 'Mensuel',
    period: '1 oct. – 31 oct. 2026',
    amount: '€9.90',
    status: 'Paid',
  },
];

export const SubscriptionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [currentPlan, setCurrentPlan] = useState<'starter' | 'pro'>('starter');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [showUpgradeCheckout, setShowUpgradeCheckout] = useState(false);
  const [confirmUpgradeOpen, setConfirmUpgradeOpen] = useState(false);

  // Billing history filters & modal
  const [invSearch, setInvSearch] = useState('');
  const [invStatus, setInvStatus] = useState<'all' | 'Paid' | 'Pending' | 'Failed'>('all');
  const [invDate, setInvDate] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<MockSubInvoice | null>(null);

  // Billing info edit state
  const [editingBilling, setEditingBilling] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    name: 'Alex Morgan',
    email: 'alex@northlight.com',
    country: 'France',
    company: 'Northlight Studio',
    address: '18 Rue de Rivoli',
    city: 'Paris',
    postalCode: '75001',
  });
  const [draftBilling, setDraftBilling] = useState(billingInfo);

  const [liveInvoices, setLiveInvoices] = useState<MockSubInvoice[] | null>(null);

  useEffect(() => {
    let active = true;
    fotodeskService.subscription
      .get()
      .then((res) => {
        if (!active) return;
        const planId = String(res?.subscription?.planId || 'starter');
        setCurrentPlan(planId.startsWith('pro') ? 'pro' : 'starter');
        if (planId === 'pro_yearly') setCycle('yearly');
        if (Array.isArray(res?.invoices) && res.invoices.length > 0) {
          setLiveInvoices(
            res.invoices.map((inv: any) => ({
              id: inv.invoice_number || `INV-${inv.id}`,
              date: inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : "Aujourd'hui",
              dateFilter: '2025',
              plan: inv.plan_id === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly',
              amount: `${((inv.amount_minor || 0) / 100).toFixed(2)} €`,
              status: inv.status === 'paid' ? 'Paid' : 'Pending',
              method: 'Carte bancaire',
              period: inv.billing_interval === 'yearly' ? '1 an' : '1 mois',
            }))
          );
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    const source = liveInvoices ?? MOCK_INVOICES;
    return source.filter((inv) => {
      if (q && !inv.id.toLowerCase().includes(q) && !inv.plan.toLowerCase().includes(q)) return false;
      if (invStatus !== 'all' && inv.status !== invStatus) return false;
      if (invDate !== 'all' && inv.dateFilter !== invDate) return false;
      return true;
    });
  }, [invSearch, invStatus, invDate, liveInvoices]);

  const isPro = currentPlan === 'pro';
  const proPrice = cycle === 'monthly' ? '€9.90' : '€99';

  const handleConfirmUpgrade = async () => {
    try {
      const targetPlanId = cycle === 'monthly' ? 'pro_monthly' : 'pro_yearly';
      const res = await fotodeskService.subscription.upgrade(targetPlanId);
      setCurrentPlan('pro');
      if (res?.invoice) {
        setLiveInvoices((prev) => [
          {
            id: res.invoice.invoice_number || `INV-${res.invoice.id}`,
            date: "Aujourd'hui",
            dateFilter: '2025',
            plan: targetPlanId === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly',
            amount: `${((res.invoice.amount_minor || 0) / 100).toFixed(2)} €`,
            status: 'Paid',
            method: 'Carte bancaire',
            period: targetPlanId === 'pro_yearly' ? '1 an' : '1 mois',
          },
          ...(prev ?? []),
        ]);
      }
      setConfirmUpgradeOpen(false);
      setShowUpgradeCheckout(false);
      setActiveTab('overview');
      toast.success('Votre offre a été mise à niveau vers Pro.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur lors de la mise à niveau.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted">
            Workspace <span className="mx-1.5">/</span> <span className="text-soft">Souscription</span>
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            Souscription & Facturation
          </h1>
          <p className="mt-1 text-sm text-soft">
            Gérez votre offre, vos informations de facturation et les quotas de votre studio.
          </p>
        </div>

        {!isPro && (
          <Button
            type="button"
            variant="primary"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={() => {
              setActiveTab('plans');
              setShowUpgradeCheckout(true);
            }}
            className="w-full sm:w-auto"
          >
            Passer à Pro
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-line bg-panel p-1.5 shadow-2xs flex flex-wrap gap-1">
        {([
          { id: 'overview', label: 'Aperçu', icon: LayoutGrid },
          { id: 'plans', label: 'Offres & Tarifs', icon: CreditCard },
          { id: 'history', label: 'Historique', icon: FileText },
          { id: 'usage', label: 'Utilisation & Stockage', icon: HardDrive },
          { id: 'billingInfo', label: 'Facturation', icon: Info },
          { id: 'manage', label: 'Gérer l’offre', icon: Calendar },
        ] as const).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
                if (id !== 'plans') setShowUpgradeCheckout(false);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-white text-neutral-950 border border-neutral-200/80 shadow-xs dark:bg-neutral-800 dark:text-white dark:border-white/10'
                  : 'text-muted hover:text-heading hover:bg-hover/70 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              {label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-heading">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Abonnement actuel</p>
                <h2 className="mt-0.5 text-xl font-bold text-heading">
                  {isPro ? 'Offre Pro' : 'Offre Starter'}
                </h2>
                <p className="mt-1 text-sm text-soft">
                  {isPro
                    ? 'Galeries illimitées, livraison vidéo et portfolio personnalisé pour votre studio.'
                    : 'Une offre essentielle pour démarrer la livraison de vos galeries photo clients.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-line bg-subtle p-4 text-sm">
              <div>
                <p className="text-xs text-muted">Tarif</p>
                <p className="mt-1 font-semibold text-heading">{isPro ? `${proPrice} / ${cycle === 'monthly' ? 'mois' : 'an'}` : 'Gratuit'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Cycle</p>
                <p className="mt-1 font-semibold text-heading">{isPro ? (cycle === 'monthly' ? 'Mensuel' : 'Annuel') : 'Aucun cycle'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Statut</p>
                <div className="mt-1"><Badge tone="success">Actif</Badge></div>
              </div>
              <div>
                <p className="text-xs text-muted">Prochaine échéance</p>
                <p className="mt-1 font-semibold text-heading">{isPro ? '1 déc. 2026' : 'Non applicable'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isPro && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setActiveTab('plans');
                    setShowUpgradeCheckout(true);
                  }}
                >
                  Passer à Pro
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveTab('plans');
                  setShowUpgradeCheckout(false);
                }}
              >
                Comparer les offres
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Offre actuelle', val: isPro ? 'Pro' : 'Starter', icon: CreditCard },
              { label: 'Statut', val: 'Actif', icon: CheckCircle2 },
              { label: 'Stockage photo', val: isPro ? '1.8 GB / 100 GB' : '1.8 GB / 3 GB', icon: ImageIcon },
              { label: 'Galeries photo', val: isPro ? '2 / Illimitées' : '2 / 3 galeries', icon: LayoutGrid },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-line bg-panel p-4 shadow-2xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-soft">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted">{label}</p>
                  <p className="text-base font-bold text-heading">{val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-heading">Utilisation actuelle</h3>
                <p className="text-xs text-muted">Chaque quota est suivi séparément pour votre studio.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('usage')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Voir les quotas →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-line bg-subtle p-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="font-semibold text-heading">Stockage photo</span><span className="text-muted">1.8 GB / {isPro ? '100 GB' : '3 GB'}</span></div>
                <div className="h-1.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: isPro ? '2%' : '60%' }} /></div>
                <p className="text-[11px] text-muted">{isPro ? '98.2 GB restants' : '1.2 GB restants'}</p>
              </div>
              <div className="rounded-xl border border-line bg-subtle p-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="font-semibold text-heading">Galeries photo</span><span className="text-muted">{isPro ? '2 / Illimitées' : '2 sur 3'}</span></div>
                <div className="h-1.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: isPro ? '5%' : '66%' }} /></div>
                <p className="text-[11px] text-muted">{isPro ? 'Création illimitée incluse' : '1 galerie restante'}</p>
              </div>
              <div className="rounded-xl border border-line bg-subtle p-4 flex items-center justify-between text-xs">
                <div><p className="font-semibold text-heading">Stockage vidéo</p><p className="text-muted mt-0.5">{isPro ? '0 / 500 minutes' : 'Disponible avec Pro'}</p></div>
                <span className="text-muted">{isPro ? 'Actif' : 'Non inclus sur Starter'}</span>
              </div>
              <div className="rounded-xl border border-line bg-subtle p-4 flex items-center justify-between text-xs">
                <div><p className="font-semibold text-heading">Lecture vidéo mensuelle</p><p className="text-muted mt-0.5">{isPro ? '0 / 1 000 minutes' : 'Disponible avec Pro'}</p></div>
                <span className="text-muted">{isPro ? 'Actif' : 'Non inclus sur Starter'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLANS & PRICING */}
      {activeTab === 'plans' && !showUpgradeCheckout && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-heading">Offres & Tarifs</h2>
              <p className="text-xs text-soft">Choisissez l’offre adaptée à votre activité photo & vidéo.</p>
            </div>
            <div className="inline-flex items-center rounded-xl border border-line bg-panel p-1 self-start">
              <button
                type="button"
                onClick={() => setCycle('monthly')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${cycle === 'monthly' ? 'bg-subtle text-heading border border-line' : 'text-soft'}`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setCycle('yearly')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${cycle === 'yearly' ? 'bg-subtle text-heading border border-line' : 'text-soft'}`}
              >
                Annuel <span className="text-emerald-600 dark:text-emerald-400 ml-1">−€19.80</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs flex flex-col justify-between space-y-5">
              <div>
                <Badge tone="neutral">Gratuit</Badge>
                <h3 className="mt-3 text-xl font-bold text-heading">Starter</h3>
                <p className="text-xs text-soft mt-1">Livraison photo essentielle pour démarrer.</p>
                <p className="mt-4 text-3xl font-bold text-heading">€0 <span className="text-xs font-normal text-muted">/ toujours</span></p>
                <ul className="mt-5 space-y-2.5 text-sm text-soft">
                  {['3 galeries photo maximum', '3 GB de stockage photo', 'Liens de galeries privés', 'Code d’accès client', 'Sélection & commentaires photo'].map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {f}</li>
                  ))}
                </ul>
              </div>
              <Button type="button" variant="outline" disabled={currentPlan === 'starter'} onClick={() => setCurrentPlan('starter')}>
                {currentPlan === 'starter' ? 'Offre actuelle' : 'Revenir à Starter'}
              </Button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-amber-500/50 bg-panel p-6 shadow-2xs flex flex-col justify-between space-y-5">
              <div>
                <Badge tone="success">Recommandé</Badge>
                <h3 className="mt-3 text-xl font-bold text-heading">Pro</h3>
                <p className="text-xs text-soft mt-1">Outils avancés photo, vidéo et portfolio personnalisé.</p>
                <p className="mt-4 text-3xl font-bold text-heading">
                  {cycle === 'monthly' ? '€9.90' : '€99'}{' '}
                  <span className="text-xs font-normal text-muted">/ {cycle === 'monthly' ? 'mois' : 'an (soit €8.25/mois)'}</span>
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-heading">
                  {[
                    'Galeries photo illimitées',
                    '100 GB de stockage photo',
                    'Jusqu’à 500 minutes de stockage vidéo',
                    '1 000 minutes de lecture vidéo / mois',
                    'Commentaires vidéo horodatés',
                    'Portfolio photographe personnalisé & sous-domaine',
                    'Branding avancé & marque blanche',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {f}</li>
                  ))}
                </ul>
              </div>
              <Button
                type="button"
                variant="primary"
                disabled={isPro}
                onClick={() => setShowUpgradeCheckout(true)}
              >
                {isPro ? 'Offre actuelle' : 'Passer à Pro'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2B: UPGRADE CHECKOUT */}
      {activeTab === 'plans' && showUpgradeCheckout && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Offres & Tarifs</p>
            <h2 className="text-xl font-bold text-heading">Mettre à niveau votre offre</h2>
            <p className="text-xs text-soft">Débloquez plus de stockage, les galeries illimitées et la livraison vidéo.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-subtle border border-line text-xs font-bold text-heading">01</span>
                  <div>
                    <h3 className="text-sm font-bold text-heading">Choisir le cycle de facturation</h3>
                    <p className="text-xs text-muted">Sélectionnez la fréquence de facturation souhaitée.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCycle('monthly')}
                    className={`rounded-xl border p-4 text-left transition-all ${cycle === 'monthly' ? 'border-accent bg-subtle' : 'border-line bg-panel'}`}
                  >
                    <p className="text-sm font-bold text-heading">Mensuel</p>
                    <p className="text-xs text-muted mt-0.5">€9.90 / mois</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCycle('yearly')}
                    className={`rounded-xl border p-4 text-left transition-all ${cycle === 'yearly' ? 'border-accent bg-subtle' : 'border-line bg-panel'}`}
                  >
                    <p className="text-sm font-bold text-heading">Annuel</p>
                    <p className="text-xs text-muted mt-0.5">€99 / an · soit €8.25 / mois</p>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-subtle border border-line text-xs font-bold text-heading">02</span>
                  <div>
                    <h3 className="text-sm font-bold text-heading">Moyen de paiement</h3>
                    <p className="text-xs text-muted">Aperçu de configuration de paiement sécurisé.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-subtle p-4 flex items-center gap-3 text-xs text-soft">
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span>Paiement par carte bancaire chiffré SSL 256-bit via le portail sécurisé FotoDesk.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-line bg-panel p-5 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-heading">Récapitulatif</h3>
              <dl className="divide-y divide-line text-sm">
                <div className="py-2.5 flex justify-between"><dt className="text-muted">Offre</dt><dd className="font-semibold text-heading">Pro</dd></div>
                <div className="py-2.5 flex justify-between"><dt className="text-muted">Cycle</dt><dd className="font-semibold text-heading">{cycle === 'monthly' ? 'Mensuel' : 'Annuel'}</dd></div>
                <div className="py-2.5 flex justify-between"><dt className="text-muted">Total</dt><dd className="text-lg font-bold text-heading">{proPrice}</dd></div>
              </dl>
              <Button type="button" variant="primary" className="w-full" onClick={() => setConfirmUpgradeOpen(true)}>
                Confirmer la mise à niveau
              </Button>
              <button
                type="button"
                onClick={() => setShowUpgradeCheckout(false)}
                className="w-full text-center text-xs text-muted hover:text-heading"
              >
                Annuler et revenir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Historique de facturation</h2>
            <p className="text-xs text-soft">Consultez vos factures d’abonnement FotoDesk.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs"><p className="text-xs text-muted">Total payé</p><p className="mt-1 text-2xl font-bold text-heading">€19.80</p></div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs"><p className="text-xs text-muted">Dernier paiement</p><p className="mt-1 text-2xl font-bold text-heading">1 nov. 2026</p></div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs"><p className="text-xs text-muted">Prochaine échéance</p><p className="mt-1 text-2xl font-bold text-heading">{isPro ? '1 déc. 2026' : 'Non applicable'}</p></div>
          </div>

          <div className="rounded-2xl border border-line bg-panel shadow-2xs overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Rechercher un numéro de facture..."
                  className="h-10 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select value={invStatus} onChange={(e) => setInvStatus(e.target.value as any)} className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading">
                  <option value="all">Tous les statuts</option>
                  <option value="Paid">Payée</option>
                  <option value="Pending">En attente</option>
                  <option value="Failed">Échouée</option>
                </select>
                <select value={invDate} onChange={(e) => setInvDate(e.target.value)} className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading">
                  <option value="all">Toutes les dates</option>
                  <option value="2026-11">2026-11</option>
                  <option value="2026-10">2026-10</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">Facture</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Offre</th>
                    <th className="px-5 py-3">Cycle</th>
                    <th className="px-5 py-3">Montant</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-subtle/40">
                      <td className="px-5 py-3.5 font-semibold text-sky-600 dark:text-sky-400">{inv.id}</td>
                      <td className="px-5 py-3.5 text-soft">{inv.date}</td>
                      <td className="px-5 py-3.5 font-medium text-heading">{inv.plan}</td>
                      <td className="px-5 py-3.5 text-soft">{inv.cycle}</td>
                      <td className="px-5 py-3.5 font-semibold text-heading">{inv.amount}</td>
                      <td className="px-5 py-3.5"><Badge tone="success">Payée</Badge></td>
                      <td className="px-5 py-3.5 text-right">
                        <button type="button" onClick={() => setSelectedInvoice(inv)} className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USAGE & STORAGE */}
      {activeTab === 'usage' && (
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Utilisation & Stockage</h2>
            <p className="text-xs text-soft">Suivi en temps réel des ressources consommées par votre studio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Stockage photo', used: '1.8 GB', limit: isPro ? '100 GB' : '3 GB', pct: isPro ? 2 : 60 },
              { name: 'Galeries photo', used: '2', limit: isPro ? 'Illimitées' : '3', pct: isPro ? 5 : 66 },
              { name: 'Stockage vidéo', used: '0 min', limit: isPro ? '500 min' : 'Non disponible', pct: 0 },
              { name: 'Lecture vidéo mensuelle', used: '0 min', limit: isPro ? '1 000 min' : 'Non disponible', pct: 0 },
            ].map((q) => (
              <div key={q.name} className="rounded-xl border border-line bg-subtle p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="font-semibold text-heading">{q.name}</span><span className="text-muted">{q.used} / {q.limit}</span></div>
                <div className="h-2 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${q.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BILLING INFORMATION */}
      {activeTab === 'billingInfo' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-heading">Informations de facturation</h2>
              <p className="text-xs text-soft">Coordonnées associées à votre abonnement FotoDesk.</p>
            </div>
            {!editingBilling && (
              <Button type="button" variant="outline" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => { setDraftBilling(billingInfo); setEditingBilling(true); }}>
                Modifier
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-heading mb-1">Détails de facturation</h3>
            <p className="text-xs text-muted mb-5">Utilisés uniquement pour les factures d’abonnement FotoDesk.</p>

            {editingBilling ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setBillingInfo(draftBilling);
                  setEditingBilling(false);
                  toast.success('Informations de facturation mises à jour.');
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nom de facturation" value={draftBilling.name} onChange={(e) => setDraftBilling({ ...draftBilling, name: e.target.value })} />
                  <Input label="E-mail de facturation" value={draftBilling.email} onChange={(e) => setDraftBilling({ ...draftBilling, email: e.target.value })} />
                  <Input label="Pays" value={draftBilling.country} onChange={(e) => setDraftBilling({ ...draftBilling, country: e.target.value })} />
                  <Input label="Société / Studio" value={draftBilling.company} onChange={(e) => setDraftBilling({ ...draftBilling, company: e.target.value })} />
                  <Input label="Adresse" value={draftBilling.address} onChange={(e) => setDraftBilling({ ...draftBilling, address: e.target.value })} />
                  <Input label="Ville" value={draftBilling.city} onChange={(e) => setDraftBilling({ ...draftBilling, city: e.target.value })} />
                  <Input label="Code postal" value={draftBilling.postalCode} onChange={(e) => setDraftBilling({ ...draftBilling, postalCode: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditingBilling(false)}>Annuler</Button>
                  <Button type="submit" variant="primary">Enregistrer</Button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y divide-line text-sm">
                <div className="py-3"><dt className="text-xs text-muted">Nom</dt><dd className="mt-1 font-semibold text-heading">{billingInfo.name}</dd></div>
                <div className="py-3"><dt className="text-xs text-muted">E-mail</dt><dd className="mt-1 font-semibold text-heading">{billingInfo.email}</dd></div>
                <div className="py-3"><dt className="text-xs text-muted">Pays</dt><dd className="mt-1 font-semibold text-heading">{billingInfo.country}</dd></div>
                <div className="py-3"><dt className="text-xs text-muted">Société</dt><dd className="mt-1 font-semibold text-heading">{billingInfo.company}</dd></div>
                <div className="py-3"><dt className="text-xs text-muted">Adresse</dt><dd className="mt-1 font-semibold text-heading">{billingInfo.address}</dd></div>
                <div className="py-3"><dt className="text-xs text-muted">Ville & Code postal</dt><dd className="mt-1 font-semibold text-heading">{billingInfo.city}, {billingInfo.postalCode}</dd></div>
              </dl>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MANAGE SUBSCRIPTION */}
      {activeTab === 'manage' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Gérer l’abonnement</h2>
            <p className="text-xs text-soft">Consultez le statut de votre abonnement et gérez votre offre.</p>
          </div>
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Offre actuelle</p>
              <h3 className="mt-1 text-xl font-bold text-heading">{isPro ? 'Pro' : 'Starter'}</h3>
              <p className="text-xs text-soft mt-0.5">{isPro ? 'Abonnement Pro actif.' : 'Vous utilisez actuellement l’offre gratuite Starter.'}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div className="rounded-xl border border-line bg-subtle p-3"><p className="text-xs text-muted">Statut</p><div className="mt-1"><Badge tone="success">Actif</Badge></div></div>
              <div className="rounded-xl border border-line bg-subtle p-3"><p className="text-xs text-muted">Cycle</p><p className="mt-1 font-semibold text-heading">{isPro ? 'Mensuel' : 'Aucun'}</p></div>
              <div className="rounded-xl border border-line bg-subtle p-3"><p className="text-xs text-muted">Début</p><p className="mt-1 font-semibold text-heading">{isPro ? '1 nov. 2026' : 'Non applicable'}</p></div>
              <div className="rounded-xl border border-line bg-subtle p-3"><p className="text-xs text-muted">Renouvellement</p><p className="mt-1 font-semibold text-heading">{isPro ? '1 déc. 2026' : 'Non applicable'}</p></div>
              <div className="rounded-xl border border-line bg-subtle p-3"><p className="text-xs text-muted">Tarif</p><p className="mt-1 font-semibold text-heading">{isPro ? proPrice : 'Gratuit'}</p></div>
            </div>
            {!isPro && (
              <Button type="button" variant="primary" onClick={() => { setActiveTab('plans'); setShowUpgradeCheckout(true); }}>
                Passer à Pro
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Upgrade Modal */}
      {confirmUpgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4" role="dialog" aria-modal="true" onClick={() => setConfirmUpgradeOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Action rapide</p>
                <h2 className="mt-1 text-xl font-bold text-heading">Confirmer la mise à niveau ?</h2>
              </div>
              <button type="button" onClick={() => setConfirmUpgradeOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-line bg-subtle px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-heading">Offre Pro</span>
                <span className="font-bold text-heading">{proPrice} / {cycle === 'monthly' ? 'mois' : 'an'}</span>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={() => setConfirmUpgradeOpen(false)}>Retour</Button>
                <Button type="button" variant="primary" onClick={handleConfirmUpgrade}>Confirmer</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4" role="dialog" aria-modal="true" onClick={() => setSelectedInvoice(null)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-line/60">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Action rapide</p>
                <h2 className="mt-1 text-xl font-bold text-heading">{selectedInvoice.id}</h2>
              </div>
              <button type="button" onClick={() => setSelectedInvoice(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-line bg-subtle px-4 py-3 flex items-center justify-between">
                <div><p className="text-sm font-semibold text-heading">Abonnement FotoDesk {selectedInvoice.plan}</p><p className="text-xs text-muted">{selectedInvoice.period}</p></div>
                <Badge tone="success">Payée</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-xs text-muted">Facture</dt><dd className="font-semibold text-heading">{selectedInvoice.id}</dd></div>
                <div><dt className="text-xs text-muted">Date</dt><dd className="font-semibold text-heading">{selectedInvoice.date}</dd></div>
                <div><dt className="text-xs text-muted">Offre</dt><dd className="font-semibold text-heading">{selectedInvoice.plan}</dd></div>
                <div><dt className="text-xs text-muted">Montant</dt><dd className="font-semibold text-heading">{selectedInvoice.amount}</dd></div>
              </dl>
              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedInvoice(null)}>Fermer</Button>
                <Button type="button" variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={() => toast.success(`Facture ${selectedInvoice.id} prête au téléchargement.`)}>
                  Télécharger la facture
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

