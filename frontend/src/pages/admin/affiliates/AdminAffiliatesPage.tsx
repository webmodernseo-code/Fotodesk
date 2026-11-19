import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Settings,
  Share2,
  Users,
  X,
} from 'lucide-react';

import { Badge, Button } from '../../../components/common';

type AffiliateTab = 'overview' | 'referrals' | 'commissions' | 'payouts' | 'program';

interface MockReferral {
  id: string;
  customerName: string;
  initials: string;
  registrationDate: string;
  sortDate: number;
  plan: 'Pro Yearly' | 'Pro Monthly' | 'No Subscription';
  firstPayment: string;
  referralStatus: 'Converted' | 'Registered';
  commissionStatus: 'Pending' | 'Approved' | 'Paid' | null;
  eligibleCommission: string;
}

interface MockCommission {
  id: string;
  referralId: string;
  customerName: string;
  plan: 'Pro Monthly' | 'Pro Yearly';
  billingType: 'Monthly' | 'Yearly';
  firstPayment: string;
  rate: string;
  amount: string;
  date: string;
  registrationDate: string;
  status: 'Pending' | 'Approved' | 'Paid';
}

interface MockPayout {
  reference: string;
  date: string;
  amount: string;
  status: 'Paid';
}

const REFERRAL_CODE = 'RAKIB2026';
const REFERRAL_URL = `https://fotodesk.com/register?ref=${REFERRAL_CODE}`;

const MOCK_REFERRALS: MockReferral[] = [
  {
    id: 'REF-006',
    customerName: 'Marcus Lee',
    initials: 'ML',
    registrationDate: '8 nov. 2026',
    sortDate: 6,
    plan: 'Pro Yearly',
    firstPayment: '€99.00',
    referralStatus: 'Converted',
    commissionStatus: 'Pending',
    eligibleCommission: '€19.80',
  },
  {
    id: 'REF-005',
    customerName: 'Noah Garcia',
    initials: 'NG',
    registrationDate: '5 nov. 2026',
    sortDate: 5,
    plan: 'No Subscription',
    firstPayment: '—',
    referralStatus: 'Registered',
    commissionStatus: null,
    eligibleCommission: 'Non éligible',
  },
  {
    id: 'REF-004',
    customerName: 'Emma Brown',
    initials: 'EB',
    registrationDate: '2 nov. 2026',
    sortDate: 4,
    plan: 'Pro Monthly',
    firstPayment: '€9.90',
    referralStatus: 'Converted',
    commissionStatus: 'Approved',
    eligibleCommission: '€1.98',
  },
  {
    id: 'REF-003',
    customerName: 'James Wilson',
    initials: 'JW',
    registrationDate: '24 oct. 2026',
    sortDate: 3,
    plan: 'No Subscription',
    firstPayment: '—',
    referralStatus: 'Registered',
    commissionStatus: null,
    eligibleCommission: 'Non éligible',
  },
  {
    id: 'REF-002',
    customerName: 'Sophie Laurent',
    initials: 'SL',
    registrationDate: '18 oct. 2026',
    sortDate: 2,
    plan: 'Pro Yearly',
    firstPayment: '€99.00',
    referralStatus: 'Converted',
    commissionStatus: 'Paid',
    eligibleCommission: '€19.80',
  },
  {
    id: 'REF-001',
    customerName: 'Alex Martin',
    initials: 'AM',
    registrationDate: '14 oct. 2026',
    sortDate: 1,
    plan: 'Pro Monthly',
    firstPayment: '€9.90',
    referralStatus: 'Converted',
    commissionStatus: 'Pending',
    eligibleCommission: '€1.98',
  },
];

const MOCK_COMMISSIONS: MockCommission[] = [
  {
    id: 'COM-001',
    referralId: 'REF-001',
    customerName: 'Alex Martin',
    plan: 'Pro Monthly',
    billingType: 'Monthly',
    firstPayment: '€9.90',
    rate: '20%',
    amount: '€1.98',
    date: '15 oct. 2026',
    registrationDate: '14 oct. 2026',
    status: 'Pending',
  },
  {
    id: 'COM-002',
    referralId: 'REF-002',
    customerName: 'Sophie Laurent',
    plan: 'Pro Yearly',
    billingType: 'Yearly',
    firstPayment: '€99.00',
    rate: '20%',
    amount: '€19.80',
    date: '18 oct. 2026',
    registrationDate: '18 oct. 2026',
    status: 'Paid',
  },
  {
    id: 'COM-003',
    referralId: 'REF-004',
    customerName: 'Emma Brown',
    plan: 'Pro Monthly',
    billingType: 'Monthly',
    firstPayment: '€9.90',
    rate: '20%',
    amount: '€1.98',
    date: '3 nov. 2026',
    registrationDate: '2 nov. 2026',
    status: 'Approved',
  },
  {
    id: 'COM-004',
    referralId: 'REF-006',
    customerName: 'Marcus Lee',
    plan: 'Pro Yearly',
    billingType: 'Yearly',
    firstPayment: '€99.00',
    rate: '20%',
    amount: '€19.80',
    date: '9 nov. 2026',
    registrationDate: '8 nov. 2026',
    status: 'Pending',
  },
];

const MOCK_PAYOUTS: MockPayout[] = [
  { reference: 'PO-2026-001', date: '12 nov. 2026', amount: '€19.80', status: 'Paid' },
];

const PAGE_SIZE = 5;

function statusBadgeTone(status: string): 'success' | 'info' | 'neutral' {
  if (status === 'Converted' || status === 'Paid') return 'success';
  if (status === 'Approved') return 'info';
  return 'neutral';
}

function statusLabel(status: string): string {
  if (status === 'Converted') return 'Converti';
  if (status === 'Registered') return 'Inscrit';
  if (status === 'Pending') return 'En attente';
  if (status === 'Approved') return 'Approuvée';
  if (status === 'Paid') return 'Payée';
  return status;
}

export const AdminAffiliatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AffiliateTab>('overview');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<MockReferral | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<MockCommission | null>(null);

  const [refSearch, setRefSearch] = useState('');
  const [refStatus, setRefStatus] = useState<'all' | 'Registered' | 'Converted'>('all');
  const [refPlan, setRefPlan] = useState<'all' | 'Pro Monthly' | 'Pro Yearly' | 'No Subscription'>('all');
  const [refSort, setRefSort] = useState<'newest' | 'oldest'>('newest');
  const [refPage, setRefPage] = useState(1);

  const copyText = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(msg);
  };

  const filteredReferrals = useMemo(() => {
    const q = refSearch.trim().toLowerCase();
    const list = MOCK_REFERRALS.filter((r) => {
      if (q && !r.customerName.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      if (refStatus !== 'all' && r.referralStatus !== refStatus) return false;
      if (refPlan !== 'all' && r.plan !== refPlan) return false;
      return true;
    });
    return [...list].sort((a, b) => (refSort === 'newest' ? b.sortDate - a.sortDate : a.sortDate - b.sortDate));
  }, [refSearch, refStatus, refPlan, refSort]);

  const totalRefPages = Math.max(1, Math.ceil(filteredReferrals.length / PAGE_SIZE));
  const safeRefPage = Math.min(refPage, totalRefPages);
  const paginatedReferrals = filteredReferrals.slice((safeRefPage - 1) * PAGE_SIZE, safeRefPage * PAGE_SIZE);

  // Referral detail sub-view
  if (selectedReferral) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="text-sky-600 dark:text-sky-400 hover:underline"
              >
                Parrainages
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-soft">{selectedReferral.id}</span>
            </nav>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Détails du parrainage
            </p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
              {selectedReferral.customerName}
            </h1>
            <p className="mt-1 text-sm text-soft">
              {selectedReferral.id} · Inscrit le {selectedReferral.registrationDate}
            </p>
          </div>
          <Badge tone={statusBadgeTone(selectedReferral.referralStatus)}>
            {statusLabel(selectedReferral.referralStatus)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs">
            <h2 className="text-base font-semibold text-heading">Informations du parrainage</h2>
            <p className="text-xs text-muted mt-0.5">Fiche de suivi non sensible</p>
            <dl className="mt-4 divide-y divide-line text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">ID parrainage</dt>
                <dd className="font-semibold text-heading">{selectedReferral.id}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Client</dt>
                <dd className="font-semibold text-heading">{selectedReferral.customerName}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Date d’inscription</dt>
                <dd className="font-semibold text-heading">{selectedReferral.registrationDate}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Statut</dt>
                <dd>
                  <Badge tone={statusBadgeTone(selectedReferral.referralStatus)}>
                    {statusLabel(selectedReferral.referralStatus)}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs">
            <h2 className="text-base font-semibold text-heading">Abonnement & Commission</h2>
            <p className="text-xs text-muted mt-0.5">Premier paiement d’abonnement uniquement</p>
            <dl className="mt-4 divide-y divide-line text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Offre</dt>
                <dd className="font-semibold text-heading">{selectedReferral.plan}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Premier paiement</dt>
                <dd className="font-semibold text-heading">
                  {selectedReferral.firstPayment === '—' ? 'Aucun paiement' : selectedReferral.firstPayment}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Taux de commission</dt>
                <dd className="font-semibold text-heading">20%</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Commission éligible</dt>
                <dd className="font-semibold text-heading">{selectedReferral.eligibleCommission}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-muted">Statut commission</dt>
                <dd>
                  {selectedReferral.commissionStatus ? (
                    <Badge tone={statusBadgeTone(selectedReferral.commissionStatus)}>
                      {statusLabel(selectedReferral.commissionStatus)}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/30 px-4 py-3 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-200">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Un parrainage devient Converti uniquement après le premier paiement réussi. Les renouvellements sont exclus.</span>
        </div>
      </div>
    );
  }

  // Commission detail sub-view
  if (selectedCommission) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <button
                type="button"
                onClick={() => setSelectedCommission(null)}
                className="text-sky-600 dark:text-sky-400 hover:underline"
              >
                Historique des commissions
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-soft">{selectedCommission.id}</span>
            </nav>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Détails de la commission
            </p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
              {selectedCommission.amount}
            </h1>
            <p className="mt-1 text-sm text-soft">
              {selectedCommission.id} · {selectedCommission.customerName}
            </p>
          </div>
          <Badge tone={statusBadgeTone(selectedCommission.status)}>
            {statusLabel(selectedCommission.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xs">
            <h2 className="text-sm font-semibold text-heading mb-3">Informations commission</h2>
            <dl className="divide-y divide-line text-sm">
              <div className="py-2.5 flex justify-between"><dt className="text-muted">ID</dt><dd className="font-semibold text-heading">{selectedCommission.id}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Montant</dt><dd className="font-semibold text-heading">{selectedCommission.amount}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Taux</dt><dd className="font-semibold text-heading">{selectedCommission.rate}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Date</dt><dd className="font-semibold text-heading">{selectedCommission.date}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xs">
            <h2 className="text-sm font-semibold text-heading mb-3">Client parrainé</h2>
            <dl className="divide-y divide-line text-sm">
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Nom</dt><dd className="font-semibold text-heading">{selectedCommission.customerName}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">ID parrainage</dt><dd className="font-semibold text-heading">{selectedCommission.referralId}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Inscription</dt><dd className="font-semibold text-heading">{selectedCommission.registrationDate}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xs">
            <h2 className="text-sm font-semibold text-heading mb-3">Abonnement</h2>
            <dl className="divide-y divide-line text-sm">
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Offre</dt><dd className="font-semibold text-heading">{selectedCommission.plan}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Facturation</dt><dd className="font-semibold text-heading">{selectedCommission.billingType}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Premier paiement</dt><dd className="font-semibold text-heading">{selectedCommission.firstPayment}</dd></div>
              <div className="py-2.5 flex justify-between"><dt className="text-muted">Date paiement</dt><dd className="font-semibold text-heading">{selectedCommission.date}</dd></div>
            </dl>
          </div>
        </div>

        {/* Formula card */}
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
          <div className="p-3">
            <p className="text-xs text-muted">Premier paiement d’abonnement</p>
            <p className="mt-1 text-xl font-bold text-heading">{selectedCommission.firstPayment}</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted">Taux de commission</p>
            <p className="mt-1 text-xl font-bold text-heading">{selectedCommission.rate}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Commission gagnée</p>
            <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">{selectedCommission.amount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/30 px-4 py-3 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-200">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>La commission est calculée uniquement sur le premier paiement d’abonnement réussi. Les renouvellements sont exclus.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted">
            Workspace <span className="mx-1.5">/</span> <span className="text-soft">Affiliation</span>
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            Programme d’affiliation
          </h1>
          <p className="mt-1 text-sm text-soft">
            Partagez FotoDesk et percevez une commission sur le premier paiement d’abonnement.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={<Copy className="w-4 h-4" />}
          onClick={() => copyText(REFERRAL_URL, 'Lien de parrainage copié')}
          className="w-full sm:w-auto"
        >
          Copier le lien de parrainage
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="rounded-2xl border border-line bg-panel p-1.5 shadow-2xs flex flex-wrap gap-1">
        {([
          { id: 'overview', label: 'Aperçu' },
          { id: 'referrals', label: 'Parrainages' },
          { id: 'commissions', label: 'Commissions' },
          { id: 'payouts', label: 'Paiements' },
          { id: 'program', label: 'Informations du programme' },
        ] as const).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-subtle text-heading border border-line shadow-2xs'
                  : 'text-soft hover:text-heading border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-amber-600 dark:text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Activé automatiquement</p>
              <h2 className="mt-1 text-lg font-bold text-heading">Votre espace affilié est actif</h2>
              <p className="mt-1 text-sm text-soft">
                Votre accès affilié est activé automatiquement avec votre compte Photographe. Partagez votre lien pour inviter de nouveaux clients FotoDesk.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 font-medium text-heading">
                  Statut : <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Actif</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 font-medium text-heading">
                  Taux de commission : <strong>20%</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 font-medium text-heading">
                  Lien : <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Actif</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle px-3 py-1.5 font-medium text-heading">
                  Compte : <strong>Photographe</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total parrainages', value: '6', hint: 'Inscrits via votre lien', icon: Users },
              { label: 'Clients convertis', value: '4', hint: 'Premier paiement effectué', icon: CheckCircle2 },
              { label: 'Commission gagnée', value: '€43.56', hint: 'Gains cumulés', icon: Share2 },
              { label: 'En attente', value: '€21.78', hint: 'Commissions en attente', icon: Calendar },
            ].map(({ label, value, hint, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-line bg-panel p-4 shadow-2xs flex items-center gap-3.5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-soft">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted truncate">{label}</p>
                  <p className="text-2xl font-bold text-heading tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted truncate">{hint}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Referral Link Card */}
          <div className="rounded-2xl border border-line bg-panel p-6 shadow-2xs space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Votre lien de parrainage</p>
              <h2 className="mt-1 text-lg font-bold text-heading">Partagez votre lien unique</h2>
              <p className="text-xs text-soft mt-0.5">Invitez de nouveaux clients FotoDesk avec votre URL de parrainage.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={REFERRAL_URL}
                className="h-10 flex-1 rounded-xl border border-line bg-subtle px-3.5 text-sm font-mono text-heading focus:outline-none"
              />
              <Button type="button" variant="outline" leftIcon={<Copy className="w-4 h-4" />} onClick={() => copyText(REFERRAL_URL, 'Lien de parrainage copié')}>
                Copier le lien
              </Button>
              <Button type="button" variant="primary" leftIcon={<Share2 className="w-4 h-4" />} onClick={() => setShareModalOpen(true)}>
                Partager le lien
              </Button>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-muted">Code de parrainage :</span>
              <span className="text-xs font-bold tracking-wider text-heading">{REFERRAL_CODE}</span>
              <button
                type="button"
                onClick={() => copyText(REFERRAL_CODE, 'Code copié')}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-hover"
              >
                <Copy className="w-3 h-3" /> Copier le code
              </button>
            </div>
          </div>

          {/* Bottom 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-line bg-panel p-6 shadow-2xs space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-amber-600 dark:text-amber-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Règle de commission</p>
                  <h3 className="text-base font-bold text-heading">Gagnez 20% de commission</h3>
                  <p className="text-xs text-soft mt-1">
                    Percevez 20% sur le premier paiement d’abonnement de chaque client inscrit via votre lien.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-subtle p-4">
                  <p className="text-xs text-muted">Premier paiement mensuel</p>
                  <p className="mt-1 text-xl font-bold text-heading">€9.90</p>
                  <p className="mt-1 text-xs text-soft">Votre commission : €1.98</p>
                </div>
                <div className="rounded-xl border border-line bg-subtle p-4">
                  <p className="text-xs text-muted">Premier paiement annuel</p>
                  <p className="mt-1 text-xl font-bold text-heading">€99.00</p>
                  <p className="mt-1 text-xs text-soft">Votre commission : €19.80</p>
                </div>
              </div>
              <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/30 px-3.5 py-2.5 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-200">
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Les renouvellements d’abonnement ne sont pas éligibles aux commissions.</span>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-line bg-panel p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-heading">Parrainages récents</h3>
                  <p className="text-xs text-muted">Derniers inscrits via votre lien</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('referrals')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Tout voir <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-line">
                {MOCK_REFERRALS.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReferral(r)}
                    className="w-full py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:opacity-80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-xs font-semibold text-soft">
                        {r.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-heading truncate">{r.customerName}</p>
                        <p className="text-xs text-muted truncate">{r.plan} · {r.registrationDate}</p>
                      </div>
                    </div>
                    <Badge tone={statusBadgeTone(r.referralStatus)}>{statusLabel(r.referralStatus)}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REFERRALS */}
      {activeTab === 'referrals' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Parrainages</h2>
            <p className="text-xs text-soft">Suivez les clients ayant rejoint FotoDesk via votre lien de parrainage.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
              <p className="text-xs text-muted">Parrainages inscrits</p>
              <p className="mt-1 text-2xl font-bold text-heading">6</p>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
              <p className="text-xs text-muted">Clients convertis</p>
              <p className="mt-1 text-2xl font-bold text-heading">4</p>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
              <p className="text-xs text-muted">Non convertis</p>
              <p className="mt-1 text-2xl font-bold text-heading">2</p>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel shadow-2xs overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={refSearch}
                  onChange={(e) => { setRefSearch(e.target.value); setRefPage(1); }}
                  placeholder="Rechercher un client ou ID..."
                  className="h-10 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={refStatus} onChange={(e) => { setRefStatus(e.target.value as any); setRefPage(1); }} className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading">
                  <option value="all">Tous les statuts</option>
                  <option value="Registered">Inscrit</option>
                  <option value="Converted">Converti</option>
                </select>
                <select value={refPlan} onChange={(e) => { setRefPlan(e.target.value as any); setRefPage(1); }} className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading">
                  <option value="all">Toutes les offres</option>
                  <option value="Pro Monthly">Pro Mensuel</option>
                  <option value="Pro Yearly">Pro Annuel</option>
                  <option value="No Subscription">Aucun abonnement</option>
                </select>
                <select value={refSort} onChange={(e) => setRefSort(e.target.value as any)} className="h-10 rounded-xl border border-line bg-panel px-3 text-sm text-heading">
                  <option value="newest">Plus récents</option>
                  <option value="oldest">Plus anciens</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Inscription</th>
                    <th className="px-5 py-3">Offre</th>
                    <th className="px-5 py-3">1er paiement</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Commission</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {paginatedReferrals.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReferral(r)}
                      className="hover:bg-subtle/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-sky-600 dark:text-sky-400">{r.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-heading">{r.customerName}</td>
                      <td className="px-5 py-3.5 text-soft">{r.registrationDate}</td>
                      <td className="px-5 py-3.5 text-soft">{r.plan}</td>
                      <td className="px-5 py-3.5 text-heading font-medium">{r.firstPayment}</td>
                      <td className="px-5 py-3.5"><Badge tone={statusBadgeTone(r.referralStatus)}>{statusLabel(r.referralStatus)}</Badge></td>
                      <td className="px-5 py-3.5">
                        {r.commissionStatus ? <Badge tone={statusBadgeTone(r.commissionStatus)}>{statusLabel(r.commissionStatus)}</Badge> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right"><ChevronRight className="inline h-4 w-4 text-muted" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3.5 text-xs text-muted">
              <span>Affichage de {paginatedReferrals.length} sur {filteredReferrals.length} parrainages</span>
              <div className="flex items-center gap-1.5">
                <button type="button" disabled={safeRefPage <= 1} onClick={() => setRefPage((p) => p - 1)} className="h-8 w-8 rounded-lg border border-line flex items-center justify-center disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                {Array.from({ length: totalRefPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setRefPage(n)} className={`h-8 min-w-[2rem] rounded-lg px-2 font-semibold ${n === safeRefPage ? 'bg-accent text-white' : 'border border-line'}`}>{n}</button>
                ))}
                <button type="button" disabled={safeRefPage >= totalRefPages} onClick={() => setRefPage((p) => p + 1)} className="h-8 w-8 rounded-lg border border-line flex items-center justify-center disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Historique des commissions</h2>
            <p className="text-xs text-soft">Commissions générées par les premiers paiements d’abonnement éligibles.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Commission totale', val: '€43.56' },
              { label: 'En attente', val: '€21.78' },
              { label: 'Approuvée', val: '€1.98' },
              { label: 'Payée', val: '€19.80' },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-line bg-panel p-4 shadow-2xs">
                <p className="text-xs text-muted">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-heading">{c.val}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-panel shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Offre</th>
                  <th className="px-5 py-3">1er paiement</th>
                  <th className="px-5 py-3">Taux</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm">
                {MOCK_COMMISSIONS.map((c) => (
                  <tr key={c.id} onClick={() => setSelectedCommission(c)} className="hover:bg-subtle/40 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-sky-600 dark:text-sky-400">{c.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-heading">{c.customerName}</td>
                    <td className="px-5 py-3.5 text-soft">{c.plan}</td>
                    <td className="px-5 py-3.5 text-soft">{c.firstPayment}</td>
                    <td className="px-5 py-3.5 text-soft">{c.rate}</td>
                    <td className="px-5 py-3.5 font-bold text-heading">{c.amount}</td>
                    <td className="px-5 py-3.5 text-soft">{c.date}</td>
                    <td className="px-5 py-3.5"><Badge tone={statusBadgeTone(c.status)}>{statusLabel(c.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Paiements</h2>
            <p className="text-xs text-soft">Consultez les versements associés à vos commissions gagnées.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs"><p className="text-xs text-muted">Total gagné</p><p className="mt-1 text-2xl font-bold text-heading">€43.56</p></div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs"><p className="text-xs text-muted">Payé</p><p className="mt-1 text-2xl font-bold text-heading">€19.80</p></div>
            <div className="rounded-2xl border border-line bg-panel p-4 shadow-2xs"><p className="text-xs text-muted">En attente</p><p className="mt-1 text-2xl font-bold text-heading">€21.78</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 rounded-2xl border border-line bg-panel shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <h3 className="text-base font-bold text-heading">Historique des paiements</h3>
                <p className="text-xs text-muted">Versements enregistrés</p>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-subtle/60 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">Référence</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Montant</th>
                    <th className="px-5 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm">
                  {MOCK_PAYOUTS.map((p) => (
                    <tr key={p.reference}>
                      <td className="px-5 py-3.5 font-semibold text-heading">{p.reference}</td>
                      <td className="px-5 py-3.5 text-soft">{p.date}</td>
                      <td className="px-5 py-3.5 font-semibold text-heading">{p.amount}</td>
                      <td className="px-5 py-3.5"><Badge tone="success">{statusLabel(p.status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-line bg-panel p-6 text-center shadow-2xs">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle text-soft">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-heading">Coordonnées de paiement non configurées</h3>
              <p className="mt-1.5 text-xs text-soft leading-relaxed">
                Vos préférences de versement s’afficheront ici dès que votre mode de paiement sera configuré.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROGRAM INFO */}
      {activeTab === 'program' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-heading">Comment fonctionne le programme</h2>
            <p className="text-xs text-soft">Votre compte Photographe inclut automatiquement l’accès au programme d’affiliation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Partagez votre lien', desc: 'Partagez votre lien unique FotoDesk avec de futurs clients.', icon: Copy },
              { step: '02', title: 'Le client s’abonne', desc: 'Un nouveau client s’inscrit via votre lien et règle son premier abonnement.', icon: Users },
              { step: '03', title: 'Gagnez une commission', desc: 'Vous percevez 20% de commission sur son premier paiement d’abonnement.', icon: Share2 },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="rounded-2xl border border-line bg-panel p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-subtle text-amber-600 dark:text-amber-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-bold text-muted/50">{step}</span>
                </div>
                <h3 className="text-base font-bold text-heading">{title}</h3>
                <p className="mt-1 text-xs text-soft leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-panel shadow-2xs overflow-hidden">
            <div className="banner-info rounded-none border-b border-line px-5 py-3 font-medium">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>La commission s’applique uniquement au premier paiement d’abonnement. Les renouvellements ne génèrent pas de commission supplémentaire.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line text-sm">
              <div className="p-5 space-y-3">
                <div className="flex justify-between"><span className="text-muted">Taux de commission</span><span className="font-semibold text-heading">20%</span></div>
                <div className="flex justify-between"><span className="text-muted">Commission sur renouvellements</span><span className="font-semibold text-heading">Non incluse</span></div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between"><span className="text-muted">Paiement éligible</span><span className="font-semibold text-heading">Premier abonnement réussi</span></div>
                <div className="flex justify-between"><span className="text-muted">Accès affilié</span><span className="font-semibold text-heading">Activé automatiquement</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Referral Link Modal */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShareModalOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-panel shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-line/60">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Action rapide</p>
                <h2 className="mt-1 text-xl font-bold text-heading">Partager le lien de parrainage</h2>
              </div>
              <button type="button" onClick={() => setShareModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft hover:text-heading">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle text-amber-600 dark:text-amber-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-heading">Inviter sur FotoDesk</h3>
                <p className="mt-1 text-xs text-soft">Partagez votre URL unique de parrainage avec vos contacts.</p>
              </div>
              <div className="flex gap-2">
                <input type="text" readOnly value={REFERRAL_URL} className="h-10 flex-1 rounded-xl border border-line bg-subtle px-3 text-xs font-mono text-heading" />
                <Button type="button" variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => copyText(REFERRAL_URL, 'Lien copié')}>
                  Copier
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShareModalOpen(false)}>Fermer</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
