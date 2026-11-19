import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type CurrencyCode = 'EUR' | 'USD' | 'FCFA';
type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'preview' | 'clientView';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceActivity {
  id: string;
  label: string;
  date: string;
}

interface InvoiceRecord {
  id: string;
  number: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  relatedProject: string;
  relatedQuote: string;
  relatedContract: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  status: InvoiceStatus;
  recordedPaid: number;
  items: InvoiceLineItem[];
  notesToClient: string;
  paymentInstructions: string;
  activities: InvoiceActivity[];
  sortOrder: number;
}

const SAMPLE_CLIENTS = [
  {
    name: 'Olivia Brown',
    email: 'olivia.brown@example.com',
    phone: '(718) 555-0199',
    address: '140 Clinton Avenue, Brooklyn, NY',
    project: 'Graduation Photography',
    quote: 'Q-004',
    contract: 'CON-2026-004',
  },
  {
    name: 'Emily Carter',
    email: 'emily.carter@example.com',
    phone: '(917) 555-0114',
    address: '24 West 14th Street, New York, NY',
    project: 'Personal Portrait Session',
    quote: 'Q-002',
    contract: 'CON-2026-002',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '(212) 555-0182',
    address: '88 Mercer Street, New York, NY',
    project: 'Sarah & Michael Wedding',
    quote: 'Q-001',
    contract: 'CON-2026-001',
  },
  {
    name: 'Daniel Smith',
    email: 'daniel.smith@example.com',
    phone: '(646) 555-0147',
    address: '410 Park Avenue, New York, NY',
    project: 'Corporate Event',
    quote: 'Q-003',
    contract: 'CON-2026-003',
  },
];

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-4',
    number: 'INV-2026-004',
    title: 'Brand Campaign Invoice',
    clientName: 'Olivia Brown',
    clientEmail: 'olivia.brown@example.com',
    clientPhone: '(718) 555-0199',
    clientAddress: '140 Clinton Avenue, Brooklyn, NY',
    relatedProject: 'Graduation Photography',
    relatedQuote: 'Q-004',
    relatedContract: 'CON-2026-004',
    issueDate: '2025-06-08',
    dueDate: '2025-06-22',
    currency: 'EUR',
    status: 'draft',
    recordedPaid: 0,
    items: [
      { id: 'i-1', description: 'Brand Campaign Photography', quantity: 1, unitPrice: 1200 },
      { id: 'i-2', description: 'Commercial Image Editing', quantity: 1, unitPrice: 300 },
    ],
    notesToClient: 'Facture partagée pour le projet de campagne photo.',
    paymentInstructions: 'Règlement par virement bancaire (référence INV-2026-004).',
    activities: [
      { id: 'a-1', label: 'Facture créée', date: '8 juin 2025' },
    ],
    sortOrder: 4,
  },
  {
    id: 'inv-2',
    number: 'INV-2026-002',
    title: 'Corporate Event Photography',
    clientName: 'Emily Carter',
    clientEmail: 'emily.carter@example.com',
    clientPhone: '(917) 555-0114',
    clientAddress: '24 West 14th Street, New York, NY',
    relatedProject: 'Personal Portrait Session',
    relatedQuote: 'Q-002',
    relatedContract: 'CON-2026-002',
    issueDate: '2025-06-04',
    dueDate: '2025-06-18',
    currency: 'EUR',
    status: 'sent',
    recordedPaid: 0,
    items: [
      { id: 'i-3', description: 'Event Photography Coverage', quantity: 1, unitPrice: 1000 },
      { id: 'i-4', description: 'Express Image Delivery', quantity: 1, unitPrice: 200 },
    ],
    notesToClient: 'Merci de vérifier les détails de la facture et de nous contacter pour toute question.',
    paymentInstructions: 'Indiquez le numéro de facture lors de votre virement.',
    activities: [
      { id: 'a-2', label: 'Facture envoyée', date: '4 juin 2025' },
      { id: 'a-3', label: 'Facture créée', date: '4 juin 2025' },
    ],
    sortOrder: 3,
  },
  {
    id: 'inv-1',
    number: 'INV-2026-001',
    title: 'Wedding Photography Invoice',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.johnson@example.com',
    clientPhone: '(212) 555-0182',
    clientAddress: '88 Mercer Street, New York, NY',
    relatedProject: 'Sarah & Michael Wedding',
    relatedQuote: 'Q-001',
    relatedContract: 'CON-2026-001',
    issueDate: '2025-06-01',
    dueDate: '2025-06-15',
    currency: 'EUR',
    status: 'paid',
    recordedPaid: 850,
    items: [
      { id: 'i-5', description: 'Reportage Mariage Journée Complète', quantity: 1, unitPrice: 850 },
    ],
    notesToClient: 'Merci pour votre confiance !',
    paymentInstructions: 'Paiement reçu par virement externe.',
    activities: [
      { id: 'a-4', label: 'Paiement externe enregistré', date: '5 juin 2025' },
      { id: 'a-5', label: 'Facture envoyée', date: '1 juin 2025' },
      { id: 'a-6', label: 'Facture créée', date: '1 juin 2025' },
    ],
    sortOrder: 2,
  },
  {
    id: 'inv-3',
    number: 'INV-2026-003',
    title: 'Portrait Session Invoice',
    clientName: 'Daniel Smith',
    clientEmail: 'daniel.smith@example.com',
    clientPhone: '(646) 555-0147',
    clientAddress: '410 Park Avenue, New York, NY',
    relatedProject: 'Corporate Event',
    relatedQuote: 'Q-003',
    relatedContract: 'CON-2026-003',
    issueDate: '2025-05-15',
    dueDate: '2025-05-29',
    currency: 'EUR',
    status: 'overdue',
    recordedPaid: 0,
    items: [
      { id: 'i-6', description: 'Séance Portrait Studio', quantity: 1, unitPrice: 450 },
    ],
    notesToClient: 'Merci de procéder au règlement à votre convenance.',
    paymentInstructions: 'Virement bancaire avec référence INV-2026-003.',
    activities: [
      { id: 'a-7', label: 'Facture envoyée', date: '15 mai 2025' },
      { id: 'a-8', label: 'Facture créée', date: '15 mai 2025' },
    ],
    sortOrder: 1,
  },
];

const formatAmount = (amount: number, currency: CurrencyCode) => {
  if (currency === 'USD') return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'FCFA') return `${amount.toLocaleString('fr-FR')} FCFA`;
  return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDisplayDate = (isoDate: string) => {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const computeTotal = (items: InvoiceLineItem[]) =>
  items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);

const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const styles: Record<InvoiceStatus, { cls: string; label: string }> = {
    draft: { cls: 'badge-neutral', label: 'Brouillon' },
    sent: { cls: 'badge-info', label: 'Envoyée' },
    paid: { cls: 'badge-success', label: 'Payée' },
    overdue: { cls: 'badge-danger', label: 'En retard' },
    cancelled: { cls: 'badge-neutral', label: 'Annulée' },
  };

  const cfg = styles[status];
  return (
    <span className={cfg.cls}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
};

const inputCls =
  'w-full h-10 px-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors';

const labelCls = 'block text-xs font-medium text-heading mb-1.5';

export const InvoicesWorkspace: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [returnTargetAfterPreview, setReturnTargetAfterPreview] = useState<'create' | 'edit' | 'detail'>('detail');

  // List filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'dueDate' | 'amount'>('newest');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);

  // Editor form state
  const [draftForm, setDraftForm] = useState<InvoiceRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Modals
  const [statusModalTarget, setStatusModalTarget] = useState<InvoiceRecord | null>(null);
  const [nextStatusValue, setNextStatusValue] = useState<InvoiceStatus>('sent');
  const [shareModalTarget, setShareModalTarget] = useState<InvoiceRecord | null>(null);
  const [shareMessage, setShareMessage] = useState('Merci de consulter votre facture Northlight Studio.');
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);

  // Toast
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const showToast = (message: string, title = 'Succès') => {
    setToast({ title, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId]
  );

  // KPIs
  const kpis = useMemo(() => {
    const total = invoices.length;
    const paidList = invoices.filter((i) => i.status === 'paid');
    const paidAmount = paidList.reduce((acc, i) => acc + computeTotal(i.items), 0);
    const unpaid = invoices.filter((i) => i.status === 'draft' || i.status === 'sent').length;
    const overdue = invoices.filter((i) => i.status === 'overdue').length;
    return { total, paidCount: paidList.length, paidAmount, unpaid, overdue };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (
          q &&
          !inv.number.toLowerCase().includes(q) &&
          !inv.title.toLowerCase().includes(q) &&
          !inv.clientName.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.sortOrder - a.sortOrder;
        if (sortBy === 'oldest') return a.sortOrder - b.sortOrder;
        if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
        return computeTotal(b.items) - computeTotal(a.items);
      });
  }, [invoices, search, statusFilter, sortBy]);

  const startCreateInvoice = () => {
    const nextNum = `INV-2026-00${invoices.length + 1}`;
    const today = new Date().toISOString().slice(0, 10);
    const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    setDraftForm({
      id: `inv-${Date.now()}`,
      number: nextNum,
      title: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      relatedProject: '',
      relatedQuote: 'Q-001',
      relatedContract: 'CON-2026-001',
      issueDate: today,
      dueDate: in14,
      currency: 'EUR',
      status: 'draft',
      recordedPaid: 0,
      items: [],
      notesToClient: '',
      paymentInstructions: '',
      activities: [{ id: `a-${Date.now()}`, label: 'Facture créée', date: "Aujourd'hui" }],
      sortOrder: Math.max(0, ...invoices.map((i) => i.sortOrder)) + 1,
    });
    setFormError(null);
    setViewMode('create');
  };

  const startEditInvoice = (inv: InvoiceRecord) => {
    setDraftForm({
      ...inv,
      items: inv.items.map((item) => ({ ...item })),
      activities: [...inv.activities],
    });
    setSelectedInvoiceId(inv.id);
    setFormError(null);
    setOpenMenuId(null);
    setViewMode('edit');
  };

  const openDetail = (inv: InvoiceRecord) => {
    setSelectedInvoiceId(inv.id);
    setOpenMenuId(null);
    setDetailMenuOpen(false);
    setViewMode('detail');
  };

  const duplicateInvoice = (inv: InvoiceRecord) => {
    const copyNumber = `INV-2026-00${invoices.length + 1}`;
    const duplicated: InvoiceRecord = {
      ...inv,
      id: `inv-${Date.now()}`,
      number: copyNumber,
      title: `${inv.title} — Copie`,
      status: 'draft',
      recordedPaid: 0,
      items: inv.items.map((i, idx) => ({ ...i, id: `dup-${Date.now()}-${idx}` })),
      activities: [
        { id: `a-${Date.now()}`, label: 'Facture dupliquée en brouillon', date: "Aujourd'hui" },
      ],
      sortOrder: Math.max(0, ...invoices.map((i) => i.sortOrder)) + 1,
    };
    setInvoices((prev) => [duplicated, ...prev]);
    setDraftForm(duplicated);
    setSelectedInvoiceId(duplicated.id);
    setOpenMenuId(null);
    setDetailMenuOpen(false);
    setViewMode('edit');
    showToast('Copie brouillon créée avec succès.');
  };

  const saveDraftForm = () => {
    if (!draftForm) return;
    setFormError(null);
    if (!draftForm.title.trim()) {
      setFormError('Veuillez saisir un titre de facture.');
      return;
    }
    if (!draftForm.clientName.trim()) {
      setFormError('Veuillez renseigner le nom du client.');
      return;
    }

    const exists = invoices.some((i) => i.id === draftForm.id);
    if (exists) {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === draftForm.id
            ? {
                ...draftForm,
                activities: [
                  { id: `a-${Date.now()}`, label: 'Facture mise à jour', date: "Aujourd'hui" },
                  ...draftForm.activities,
                ],
              }
            : i
        )
      );
      setSelectedInvoiceId(draftForm.id);
      setViewMode('detail');
      showToast('Facture mise à jour avec succès.');
    } else {
      setInvoices((prev) => [draftForm, ...prev]);
      setSelectedInvoiceId(draftForm.id);
      setViewMode('detail');
      showToast('Facture enregistrée comme brouillon.');
    }
  };

  const openStatusModal = (inv: InvoiceRecord) => {
    setStatusModalTarget(inv);
    setNextStatusValue(inv.status);
    setDetailMenuOpen(false);
  };

  const confirmStatusUpdate = () => {
    if (!statusModalTarget) return;
    const total = computeTotal(statusModalTarget.items);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === statusModalTarget.id
          ? {
              ...inv,
              status: nextStatusValue,
              recordedPaid: nextStatusValue === 'paid' ? total : inv.recordedPaid,
              activities: [
                {
                  id: `a-${Date.now()}`,
                  label: `Statut mis à jour (${nextStatusValue === 'paid' ? 'Payée' : nextStatusValue === 'sent' ? 'Envoyée' : nextStatusValue === 'overdue' ? 'En retard' : nextStatusValue === 'cancelled' ? 'Annulée' : 'Brouillon'})`,
                  date: "Aujourd'hui",
                },
                ...inv.activities,
              ],
            }
          : inv
      )
    );
    setStatusModalTarget(null);
    showToast('Statut de la facture mis à jour.');
  };

  const confirmShareInvoice = () => {
    if (!shareModalTarget) return;
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === shareModalTarget.id
          ? {
              ...inv,
              status: inv.status === 'draft' ? 'sent' : inv.status,
              activities: [
                { id: `a-${Date.now()}`, label: 'Facture partagée avec le client', date: "Aujourd'hui" },
                ...inv.activities,
              ],
            }
          : inv
      )
    );
    setShareModalTarget(null);
    showToast('Facture marquée comme envoyée et lien prêt à partager.');
  };

  const confirmDeleteInvoice = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setInvoices((prev) => prev.filter((inv) => inv.id !== targetId));
    setDeleteTarget(null);
    if (selectedInvoiceId === targetId) {
      setSelectedInvoiceId(null);
      setViewMode('list');
    }
    showToast('Facture supprimée avec succès.');
  };

  // CLIENT VIEW
  if (viewMode === 'clientView' && selectedInvoice) {
    const total = computeTotal(selectedInvoice.items);
    const remaining = Math.max(0, total - selectedInvoice.recordedPaid);
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-panel border border-line rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent text-white font-bold text-sm flex items-center justify-center">
              F
            </div>
            <div>
              <p className="text-sm font-semibold text-heading">Northlight Studio</p>
              <p className="text-xs text-muted">Facture client</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('detail')}
            className="btn-outline text-xs sm:text-sm"
          >
            Fermer la facture
          </button>
        </div>

        <div className="text-center space-y-2 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Facture de Northlight Studio
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-heading">{selectedInvoice.title}</h1>
          <div className="flex items-center justify-center gap-2.5 text-xs text-muted">
            <span>{selectedInvoice.number}</span>
            <StatusBadge status={selectedInvoice.status} />
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-panel border border-line rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-b border-line pb-5">
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">Studio</p>
              <p className="font-semibold text-heading">Northlight Studio</p>
              <p className="text-soft">hello@northlight.studio</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">Facturé à</p>
              <p className="font-semibold text-heading">{selectedInvoice.clientName}</p>
              <p className="text-soft">{selectedInvoice.clientEmail}</p>
              <p className="text-soft">{selectedInvoice.clientAddress}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">Projet</p>
              <p className="font-semibold text-heading">{selectedInvoice.relatedProject || '—'}</p>
              <p className="text-muted mt-2 uppercase font-semibold">Échéance</p>
              <p className="font-semibold text-heading">{formatDisplayDate(selectedInvoice.dueDate)}</p>
            </div>
          </div>

          <div className="border border-line rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-subtle border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3 text-center">Qté</th>
                  <th className="py-2.5 px-3 text-right">Prix unitaire</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {selectedInvoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-medium text-heading">{item.description}</td>
                    <td className="py-3 px-3 text-center text-soft">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-soft">
                      {formatAmount(item.unitPrice, selectedInvoice.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-heading">
                      {formatAmount(item.quantity * item.unitPrice, selectedInvoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-soft">
                <span>Sous-total</span>
                <span>{formatAmount(total, selectedInvoice.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-heading text-base pt-1.5 border-t border-line">
                <span>Montant total</span>
                <span>{formatAmount(total, selectedInvoice.currency)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-subtle border border-line/70 rounded-xl p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Montant facturé
              </p>
              <p className="text-base font-bold text-heading mt-0.5">
                {formatAmount(total, selectedInvoice.currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Payé enregistré
              </p>
              <p className="text-base font-bold text-heading mt-0.5">
                {formatAmount(selectedInvoice.recordedPaid, selectedInvoice.currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Solde restant
              </p>
              <p className="text-base font-bold text-heading mt-0.5">
                {formatAmount(remaining, selectedInvoice.currency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">
                Notes pour le client
              </p>
              <p className="text-soft">{selectedInvoice.notesToClient || '—'}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">
                Instructions de paiement
              </p>
              <p className="text-soft">{selectedInvoice.paymentInstructions || '—'}</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-panel border border-line rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-heading">Options de facture</p>
            <p className="text-[11px] text-muted">
              Consultation et export du document. Aucun paiement en ligne n&apos;est encaissé ici.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => showToast('Aperçu de la facture préparé pour le téléchargement.')}
              className="btn-outline text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger l&apos;aperçu
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer la facture
            </button>
          </div>
        </div>
        {renderModalsAndToast()}
      </div>
    );
  }

  // PREVIEW VIEW
  if (viewMode === 'preview') {
    const doc = returnTargetAfterPreview === 'detail' ? selectedInvoice : draftForm;
    if (doc) {
      const total = computeTotal(doc.items);
      return (
        <div className="space-y-6 pb-10">
          <div className="bg-panel border border-line rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setViewMode(returnTargetAfterPreview)}
              className="btn-outline text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;édition
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-heading">Aperçu de la facture</p>
              <p className="text-xs text-muted">Aperçu professionnel du document</p>
            </div>
            <div className="flex items-center gap-2.5">
              {returnTargetAfterPreview !== 'detail' && (
                <button type="button" onClick={saveDraftForm} className="btn-outline text-xs sm:text-sm">
                  Enregistrer comme brouillon
                </button>
              )}
              <button
                type="button"
                onClick={() => setShareModalTarget(doc)}
                className="btn-primary text-xs sm:text-sm"
              >
                Partager la facture
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto bg-panel border border-line rounded-2xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-white font-bold flex items-center justify-center">
                  F
                </div>
                <div>
                  <p className="text-base font-bold text-heading">Northlight Studio</p>
                  <p className="text-xs text-muted">hello@northlight.studio · Paris, France</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Facture</p>
                <p className="text-lg font-bold text-heading">{doc.number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted mb-1">Facturé à</p>
                <p className="font-semibold text-heading">{doc.clientName || 'Client non défini'}</p>
                <p className="text-soft">{doc.clientEmail}</p>
                <p className="text-soft">{doc.clientAddress}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted mb-1">Projet</p>
                <p className="font-semibold text-heading">{doc.relatedProject || '—'}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-muted mb-1">Émission / Échéance</p>
                <p className="text-heading font-medium">{formatDisplayDate(doc.issueDate)}</p>
                <p className="text-soft">Échéance : {formatDisplayDate(doc.dueDate)}</p>
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl px-5 py-3.5">
              <h2 className="text-lg font-bold text-heading">{doc.title || 'Nouvelle facture'}</h2>
            </div>

            <div className="border border-line rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-subtle border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-3 text-center">Qté</th>
                    <th className="py-2.5 px-3 text-right">Prix unitaire</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {doc.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-muted">
                        Aucune ligne ajoutée.
                      </td>
                    </tr>
                  ) : (
                    doc.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 font-medium text-heading">{item.description || 'Service'}</td>
                        <td className="py-3 px-3 text-center text-soft">{item.quantity}</td>
                        <td className="py-3 px-3 text-right text-soft">
                          {formatAmount(item.unitPrice, doc.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-heading">
                          {formatAmount(item.quantity * item.unitPrice, doc.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-1.5 text-sm">
                <div className="flex justify-between text-soft">
                  <span>Sous-total</span>
                  <span>{formatAmount(total, doc.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-heading text-base pt-1.5 border-t border-line">
                  <span>Montant total</span>
                  <span>{formatAmount(total, doc.currency)}</span>
                </div>
              </div>
            </div>
          </div>
          {renderModalsAndToast()}
        </div>
      );
    }
  }

  // CREATE / EDIT VIEW
  if ((viewMode === 'create' || viewMode === 'edit') && draftForm) {
    const total = computeTotal(draftForm.items);
    return (
      <div className="space-y-6 pb-10">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="text-accent hover:underline"
              >
                Factures
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{viewMode === 'create' ? 'Créer une facture' : draftForm.number}</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {viewMode === 'create' ? 'Nouvelle facture' : draftForm.number}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-heading">
              {viewMode === 'create' ? 'Créer une facture' : 'Modifier la facture'}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {viewMode === 'create'
                ? 'Créez une facture professionnelle pour votre client.'
                : 'Mettez à jour les informations et lignes de la facture.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'edit' && selectedInvoice ? 'detail' : 'list')}
              className="btn-outline text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                setReturnTargetAfterPreview(viewMode);
                setViewMode('preview');
              }}
              className="btn-outline text-sm"
            >
              Aperçu de la facture
            </button>
            <button type="button" onClick={saveDraftForm} className="btn-primary text-sm">
              {viewMode === 'create' ? 'Enregistrer comme brouillon' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>

        {formError && (
          <p className="text-xs font-medium text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {formError}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            {/* Invoice Info */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h2 className="text-base font-semibold text-heading">Informations de la facture</h2>
                <p className="text-xs text-muted mt-0.5">
                  Client, références, dates et devise.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Titre de la facture</label>
                  <input
                    type="text"
                    value={draftForm.title}
                    onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                    placeholder="ex. Facture Reportage Mariage"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Numéro de facture</label>
                  <input
                    type="text"
                    value={draftForm.number}
                    onChange={(e) => setDraftForm({ ...draftForm, number: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Client</label>
                  <input
                    type="text"
                    list="invoice-clients-list"
                    value={draftForm.clientName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = SAMPLE_CLIENTS.find(
                        (c) => c.name.toLowerCase() === val.toLowerCase()
                      );
                      setDraftForm({
                        ...draftForm,
                        clientName: val,
                        clientEmail: match ? match.email : draftForm.clientEmail,
                        clientPhone: match ? match.phone : draftForm.clientPhone,
                        clientAddress: match ? match.address : draftForm.clientAddress,
                        relatedProject: match ? match.project : draftForm.relatedProject,
                        relatedQuote: match ? match.quote : draftForm.relatedQuote,
                        relatedContract: match ? match.contract : draftForm.relatedContract,
                      });
                    }}
                    placeholder="Rechercher ou saisir un client..."
                    className={inputCls}
                  />
                  <datalist id="invoice-clients-list">
                    {SAMPLE_CLIENTS.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Projet associé (Optionnel)</label>
                  <input
                    type="text"
                    value={draftForm.relatedProject}
                    onChange={(e) => setDraftForm({ ...draftForm, relatedProject: e.target.value })}
                    placeholder="Rechercher un projet..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Devis associé (Optionnel)</label>
                  <select
                    value={draftForm.relatedQuote}
                    onChange={(e) => setDraftForm({ ...draftForm, relatedQuote: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Q-001">Q-001</option>
                    <option value="Q-002">Q-002</option>
                    <option value="Q-003">Q-003</option>
                    <option value="Q-004">Q-004</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Contrat associé (Optionnel)</label>
                  <select
                    value={draftForm.relatedContract}
                    onChange={(e) => setDraftForm({ ...draftForm, relatedContract: e.target.value })}
                    className={inputCls}
                  >
                    <option value="CON-2026-001">CON-2026-001</option>
                    <option value="CON-2026-002">CON-2026-002</option>
                    <option value="CON-2026-003">CON-2026-003</option>
                    <option value="CON-2026-004">CON-2026-004</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date d&apos;émission</label>
                  <input
                    type="date"
                    value={draftForm.issueDate}
                    onChange={(e) => setDraftForm({ ...draftForm, issueDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date d&apos;échéance</label>
                  <input
                    type="date"
                    value={draftForm.dueDate}
                    onChange={(e) => setDraftForm({ ...draftForm, dueDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Devise</label>
                  <select
                    value={draftForm.currency}
                    onChange={(e) =>
                      setDraftForm({ ...draftForm, currency: e.target.value as CurrencyCode })
                    }
                    className={inputCls}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="FCFA">FCFA</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h2 className="text-base font-semibold text-heading">Informations client</h2>
                <p className="text-xs text-muted mt-0.5">
                  Renseignées automatiquement lors de la sélection du client.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nom du client</label>
                  <input
                    type="text"
                    value={draftForm.clientName}
                    onChange={(e) => setDraftForm({ ...draftForm, clientName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input
                    type="email"
                    value={draftForm.clientEmail}
                    onChange={(e) => setDraftForm({ ...draftForm, clientEmail: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input
                    type="tel"
                    value={draftForm.clientPhone}
                    onChange={(e) => setDraftForm({ ...draftForm, clientPhone: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Adresse</label>
                  <input
                    type="text"
                    value={draftForm.clientAddress}
                    onChange={(e) => setDraftForm({ ...draftForm, clientAddress: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-heading">Lignes de facturation</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Ajoutez vos prestations et ajustez les montants.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraftForm({
                      ...draftForm,
                      items: [
                        ...draftForm.items,
                        { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 },
                      ],
                    })
                  }
                  className="btn-outline text-xs py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une ligne
                </button>
              </div>

              {draftForm.items.length === 0 ? (
                <div className="border border-dashed border-line rounded-xl py-8 px-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent mx-auto flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-heading">Aucune ligne pour le moment</p>
                    <p className="text-xs text-muted mt-0.5">
                      Ajoutez au moins une prestation pour calculer le total de la facture.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftForm({
                        ...draftForm,
                        items: [
                          { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 },
                        ],
                      })
                    }
                    className="btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une ligne
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {draftForm.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-subtle/50 border border-line/70 rounded-xl p-3"
                    >
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            setDraftForm({
                              ...draftForm,
                              items: draftForm.items.map((x) =>
                                x.id === item.id ? { ...x, description: e.target.value } : x
                              ),
                            })
                          }
                          placeholder="Description du service"
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            setDraftForm({
                              ...draftForm,
                              items: draftForm.items.map((x) =>
                                x.id === item.id ? { ...x, quantity: Number(e.target.value) || 0 } : x
                              ),
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            setDraftForm({
                              ...draftForm,
                              items: draftForm.items.map((x) =>
                                x.id === item.id ? { ...x, unitPrice: Number(e.target.value) || 0 } : x
                              ),
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-xs font-semibold text-heading">
                          {formatAmount(item.quantity * item.unitPrice, draftForm.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftForm({
                              ...draftForm,
                              items: draftForm.items.filter((x) => x.id !== item.id),
                            })
                          }
                          className="text-red-500 hover:text-red-600 p-1"
                          aria-label="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h2 className="text-base font-semibold text-heading">Notes additionnelles</h2>
                <p className="text-xs text-muted mt-0.5">Informations optionnelles visibles par le client.</p>
              </div>
              <div>
                <label className={labelCls}>Notes pour le client</label>
                <input
                  type="text"
                  value={draftForm.notesToClient}
                  onChange={(e) => setDraftForm({ ...draftForm, notesToClient: e.target.value })}
                  placeholder="Ajouter une note pour votre client..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Instructions de paiement manuel</label>
                <input
                  type="text"
                  value={draftForm.paymentInstructions}
                  onChange={(e) =>
                    setDraftForm({ ...draftForm, paymentInstructions: e.target.value })
                  }
                  placeholder="ex. Virement bancaire hors plateforme..."
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="bg-panel border border-line rounded-2xl p-5 space-y-4 shadow-xs sticky top-6">
            <h2 className="text-base font-semibold text-heading">Résumé de la facture</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-soft">
                <span>Sous-total</span>
                <span>{formatAmount(total, draftForm.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-heading text-base pt-2 border-t border-line">
                <span>Montant total</span>
                <span>{formatAmount(total, draftForm.currency)}</span>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Aucune taxe, remise ou commission n&apos;est appliquée. Les règlements sont suivis hors plateforme.
            </p>
          </div>
        </div>
        {renderModalsAndToast()}
      </div>
    );
  }

  // DETAIL VIEW
  if (viewMode === 'detail' && selectedInvoice) {
    const total = computeTotal(selectedInvoice.items);
    return (
      <div className="space-y-6 pb-10">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="text-accent hover:underline"
              >
                Factures
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{selectedInvoice.number}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-muted">{selectedInvoice.number}</span>
              <StatusBadge status={selectedInvoice.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-heading mt-0.5">
              {selectedInvoice.title}
            </h1>
            <p className="text-sm text-muted">Facture pour {selectedInvoice.clientName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 relative">
            <button
              type="button"
              onClick={() => startEditInvoice(selectedInvoice)}
              className="btn-outline text-xs sm:text-sm"
            >
              Modifier la facture
            </button>
            <button
              type="button"
              onClick={() => {
                setReturnTargetAfterPreview('detail');
                setViewMode('preview');
              }}
              className="btn-outline text-xs sm:text-sm"
            >
              Aperçu
            </button>
            <button
              type="button"
              onClick={() => setShareModalTarget(selectedInvoice)}
              className="btn-primary text-xs sm:text-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Partager la facture
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDetailMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-xl border border-line bg-panel flex items-center justify-center hover:bg-subtle"
                aria-label="Plus d'actions"
              >
                <MoreHorizontal className="w-4 h-4 text-soft" />
              </button>
              {detailMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-panel border border-line rounded-xl shadow-lg py-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailMenuOpen(false);
                      showToast('Aperçu de la facture préparé pour le téléchargement.');
                    }}
                    className="w-full px-3.5 py-2 text-left text-heading hover:bg-subtle"
                  >
                    Télécharger l&apos;aperçu
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateInvoice(selectedInvoice)}
                    className="w-full px-3.5 py-2 text-left text-heading hover:bg-subtle"
                  >
                    Dupliquer la facture
                  </button>
                  <button
                    type="button"
                    onClick={() => openStatusModal(selectedInvoice)}
                    className="w-full px-3.5 py-2 text-left text-heading hover:bg-subtle"
                  >
                    Mettre à jour le statut
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailMenuOpen(false);
                      setViewMode('clientView');
                    }}
                    className="w-full px-3.5 py-2 text-left text-heading hover:bg-subtle flex items-center justify-between"
                  >
                    <span>Ouvrir la vue client</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailMenuOpen(false);
                      setDeleteTarget(selectedInvoice);
                    }}
                    className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-500/10"
                  >
                    Supprimer la facture
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Montant total</p>
            <p className="text-xl font-bold text-heading mt-1">
              {formatAmount(total, selectedInvoice.currency)}
            </p>
            <p className="text-xs text-muted mt-0.5">{selectedInvoice.currency}</p>
          </div>
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Date d&apos;émission</p>
            <p className="text-xl font-bold text-heading mt-1">
              {formatDisplayDate(selectedInvoice.issueDate)}
            </p>
            <p className="text-xs text-muted mt-0.5">Cycle de facturation</p>
          </div>
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Date d&apos;échéance</p>
            <p className="text-xl font-bold text-heading mt-1">
              {formatDisplayDate(selectedInvoice.dueDate)}
            </p>
            <p className="text-xs text-muted mt-0.5">Échéance client</p>
          </div>
          <div className="bg-panel border border-line rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-muted">Statut du règlement</p>
            <div className="mt-1.5">
              <StatusBadge status={selectedInvoice.status} />
            </div>
            <button
              type="button"
              onClick={() => openStatusModal(selectedInvoice)}
              className="text-xs font-medium text-blue-600 hover:underline mt-2"
            >
              Mettre à jour le statut
            </button>
          </div>
        </div>

        {/* 3 Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-panel border border-line rounded-2xl p-5 space-y-2 shadow-xs">
            <h2 className="text-sm font-semibold text-heading">Informations client</h2>
            <p className="text-xs text-muted">Destinataire de la facture</p>
            <div className="pt-2 space-y-1 text-xs">
              <p className="text-sm font-semibold text-heading">{selectedInvoice.clientName}</p>
              <p className="text-soft">{selectedInvoice.clientEmail}</p>
              <p className="text-soft">{selectedInvoice.clientPhone}</p>
              <p className="text-soft">{selectedInvoice.clientAddress}</p>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-5 space-y-2 shadow-xs">
            <h2 className="text-sm font-semibold text-heading">Projet & références</h2>
            <p className="text-xs text-muted">Éléments du studio associés</p>
            <div className="pt-2 space-y-1.5 text-xs">
              <p className="text-sm font-semibold text-accent">
                {selectedInvoice.relatedProject || 'Aucun projet'}
              </p>
              <p className="text-soft">
                Devis : <span className="font-medium text-heading">{selectedInvoice.relatedQuote}</span>
              </p>
              <p className="text-soft">
                Contrat : <span className="font-medium text-heading">{selectedInvoice.relatedContract}</span>
              </p>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
            <div>
              <h2 className="text-sm font-semibold text-heading">Suivi du règlement</h2>
              <div className="mt-1.5">
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Le statut est suivi manuellement hors plateforme. Aucun paiement n&apos;est encaissé ou traité par FotoDesk.
            </p>
            <button
              type="button"
              onClick={() => openStatusModal(selectedInvoice)}
              className="btn-outline text-xs py-1.5 px-3"
            >
              Mettre à jour le statut
            </button>
          </div>
        </div>

        {/* Items + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 bg-panel border border-line rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-line">
              <h2 className="text-base font-semibold text-heading">Lignes de facturation</h2>
              <p className="text-xs text-muted mt-0.5">Détail des prestations et totaux</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="py-2.5 px-5">Description</th>
                    <th className="py-2.5 px-4 text-center">Qté</th>
                    <th className="py-2.5 px-4 text-right">Prix unitaire</th>
                    <th className="py-2.5 px-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-5 font-medium text-heading">{item.description}</td>
                      <td className="py-3 px-4 text-center text-soft">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-soft">
                        {formatAmount(item.unitPrice, selectedInvoice.currency)}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-heading">
                        {formatAmount(item.quantity * item.unitPrice, selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-line flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-soft">
                  <span>Sous-total</span>
                  <span>{formatAmount(total, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-heading text-base pt-1.5 border-t border-line">
                  <span>Montant total</span>
                  <span>{formatAmount(total, selectedInvoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-2xl p-5 space-y-3 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-heading">Activité</h2>
              <p className="text-xs text-muted mt-0.5">Historique de la facture</p>
            </div>
            <div className="space-y-3 pt-1">
              {selectedInvoice.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-heading">{act.label}</p>
                    <p className="text-muted">{act.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
          <div>
            <h2 className="text-base font-semibold text-heading">Notes et instructions de paiement</h2>
            <p className="text-xs text-muted mt-0.5">Informations partagées avec le client</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">Notes pour le client</p>
              <p className="text-soft">{selectedInvoice.notesToClient || '—'}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted mb-1">
                Instructions de paiement
              </p>
              <p className="text-soft">{selectedInvoice.paymentInstructions || '—'}</p>
            </div>
          </div>
        </div>

        {renderModalsAndToast()}
      </div>
    );
  }

  function renderModalsAndToast() {
    return (
      <>
        {/* Update Payment Status Modal */}
        {statusModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    Mettre à jour le statut
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModalTarget(null)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-subtle border border-line/70 rounded-xl p-3.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="text-muted mb-1">Statut actuel</p>
                  <StatusBadge status={statusModalTarget.status} />
                </div>
                <span className="text-muted">→</span>
                <div>
                  <p className="text-muted mb-1">Nouveau statut</p>
                  <StatusBadge status={nextStatusValue} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Nouveau statut</label>
                <select
                  value={nextStatusValue}
                  onChange={(e) => setNextStatusValue(e.target.value as InvoiceStatus)}
                  className={inputCls}
                >
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyée</option>
                  <option value="paid">Payée</option>
                  <option value="overdue">En retard</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="banner-info">
                Suivi manuel du statut uniquement. Aucun paiement n&apos;est encaissé ou traité par FotoDesk.
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStatusModalTarget(null)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button type="button" onClick={confirmStatusUpdate} className="btn-primary text-sm">
                  Enregistrer la mise à jour
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Invoice Modal */}
        {shareModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">Partager la facture</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShareModalTarget(null)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-subtle border border-line/70 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-heading truncate">
                    {shareModalTarget.title}
                  </p>
                  <p className="text-xs text-muted">
                    {shareModalTarget.number} · {shareModalTarget.clientName}
                  </p>
                </div>
              </div>

              <div>
                <label className={labelCls}>E-mail du client</label>
                <input
                  type="email"
                  readOnly
                  value={shareModalTarget.clientEmail}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Lien de la facture</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://invoices.fotodesk.com/${shareModalTarget.number.toLowerCase()}`}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(
                        `https://invoices.fotodesk.com/${shareModalTarget.number.toLowerCase()}`
                      );
                      showToast('Lien de facture copié dans le presse-papiers.');
                    }}
                    className="btn-outline text-xs shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier le lien
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Message optionnel</label>
                <input
                  type="text"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShareModalTarget(null)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button type="button" onClick={confirmShareInvoice} className="btn-primary text-sm">
                  Partager la facture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Invoice Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-panel border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Action rapide
                  </p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">Supprimer la facture ?</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 py-1">
                <div className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <p className="text-sm text-soft leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <span className="font-semibold text-heading">
                    {deleteTarget.number} — {deleteTarget.title}
                  </span>{' '}
                  ? Les clients, projets, devis et contrats associés ne seront pas supprimés.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn-outline text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteInvoice}
                  className="btn-danger"
                >
                  Supprimer la facture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-panel border border-line rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-heading">{toast.title}</p>
              <p className="text-xs text-muted">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 shrink-0"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </>
    );
  }

  // MAIN LIST VIEW
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted mb-1">
            Espace de travail <span className="mx-1">/</span> Factures
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">Factures</h1>
          <p className="text-sm text-muted mt-1">
            Gérez vos factures, suivez les règlements hors plateforme et gardez vos finances organisées.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreateInvoice}
          className="btn-primary text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Créer une facture
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Total des factures</p>
            <p className="text-2xl font-bold text-heading mt-0.5">{kpis.total}</p>
            <p className="text-xs text-muted mt-0.5">Toutes les factures du studio</p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Factures payées</p>
            <p className="text-2xl font-bold text-heading mt-0.5">{kpis.paidCount}</p>
            <p className="text-xs text-muted mt-0.5">{formatAmount(kpis.paidAmount, 'EUR')}</p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Factures impayées</p>
            <p className="text-2xl font-bold text-heading mt-0.5">{kpis.unpaid}</p>
            <p className="text-xs text-muted mt-0.5">En attente ou brouillon</p>
          </div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Factures en retard</p>
            <p className="text-2xl font-bold text-heading mt-0.5">{kpis.overdue}</p>
            <p className="text-xs text-muted mt-0.5">Nécessite une relance manuelle</p>
          </div>
        </div>
      </div>

      {/* All Invoices Card */}
      <div className="bg-panel border border-line rounded-2xl shadow-xs overflow-visible">
        <div className="p-5 sm:p-6 space-y-4 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-heading">Toutes les factures</h2>
            <p className="text-xs text-muted mt-0.5">
              {filteredInvoices.length} {filteredInvoices.length > 1 ? 'factures' : 'facture'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un numéro, titre ou client..."
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-panel border border-line rounded-xl text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | InvoiceStatus)}
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
                <option value="cancelled">Annulée</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'newest' | 'oldest' | 'dueDate' | 'amount')
                }
                className="h-10 px-3 text-sm bg-panel border border-line rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="newest">Date d&apos;émission récente</option>
                <option value="oldest">Date d&apos;émission ancienne</option>
                <option value="dueDate">Date d&apos;échéance</option>
                <option value="amount">Montant</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/60 border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-3 px-5">Numéro</th>
                <th className="py-3 px-4">Titre</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Projet associé</th>
                <th className="py-3 px-4">Émission</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4">Montant total</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-muted">
                    Aucune facture ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const total = computeTotal(inv.items);
                  return (
                    <tr key={inv.id} className="hover:bg-subtle/40 transition-colors">
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetail(inv)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {inv.number}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-heading whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetail(inv)}
                          className="hover:underline text-left"
                        >
                          {inv.title}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">{inv.clientName}</td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                        {inv.relatedProject || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                        {formatDisplayDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-soft whitespace-nowrap">
                        {formatDisplayDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-heading whitespace-nowrap">
                        {formatAmount(total, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right relative whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === inv.id ? null : inv.id)}
                          className="w-8 h-8 rounded-lg hover:bg-subtle inline-flex items-center justify-center text-soft"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenuId === inv.id && (
                          <div className="absolute right-5 mt-1 w-48 bg-panel border border-line rounded-xl shadow-lg py-1.5 z-30 text-left text-xs">
                            <button
                              type="button"
                              onClick={() => openDetail(inv)}
                              className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                            >
                              Voir la facture
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditInvoice(inv)}
                              className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                            >
                              Modifier la facture
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateInvoice(inv)}
                              className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                            >
                              Dupliquer la facture
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setShareModalTarget(inv);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-subtle text-heading"
                            >
                              Partager la facture
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteTarget(inv);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-red-500/10 text-red-600"
                            >
                              Supprimer la facture
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-line flex items-center justify-between text-xs text-muted">
          <span>
            Affichage {filteredInvoices.length === 0 ? 0 : 1}–{filteredInvoices.length} sur{' '}
            {filteredInvoices.length} {filteredInvoices.length > 1 ? 'factures' : 'facture'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-8 h-8 rounded-lg border border-line flex items-center justify-center opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </span>
            <span className="w-8 h-8 rounded-lg bg-accent text-white font-semibold flex items-center justify-center">
              1
            </span>
            <span className="w-8 h-8 rounded-lg border border-line flex items-center justify-center opacity-40">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {renderModalsAndToast()}
    </div>
  );
};

