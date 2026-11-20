/**
 * Invoice editor — create (manual) or edit.
 * Faithfully redesigned to match the FotoDesk reference creation interface:
 * 2-column layout with 4 dark matte panels on the left, live A4 invoice
 * sheet preview + summary card on the right, and full backend persistence.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Layers,
  CreditCard,
  Eye,
  Receipt,
  Calendar,
  User,
  Folder,
  Coins,
  Trash2,
  Plus,
  Pencil,
  Paperclip,
  Send,
  Save as SaveIcon,
  ExternalLink,
  ChevronDown,
  Settings2,
  X,
  Camera,
  Check,
  Building2,
} from 'lucide-react';
import { Loading } from '../../../components/common';
import { billsService, type InvoiceCreatePayload, type InvoiceQrFormat } from '../../../services/bills.service';
import { businessProfileService } from '../../../services/businessProfile.service';
import {
  toEditableLineItem, toPayloadLineItem, type EditableLineItem,
} from '../../../components/admin/LineItemsTable';
import { InstallmentsPanel } from '../../../components/admin/InstallmentsPanel';
import { customerAdminService } from '../../../services/customerAdmin.service';
import { toast } from 'react-toastify';

function toMinor(amount: number) {
  return Math.round((Number(amount) || 0) * 100);
}

function formatCurrencyFr(amount: number, currency = 'EUR') {
  const symbol = currency === 'CHF' ? 'CHF' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const formatted = (amount || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}

function formatDateToFr(dateStr?: string) {
  if (!dateStr) return '';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatFrToIso(frStr?: string) {
  if (!frStr) return '';
  const parts = frStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return frStr;
}

/** Vector FotoDesk 4-diamond clover logo */
const FotoDeskDiamonds: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "text-emerald-400" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor" className={className}>
    {/* Top diamond */}
    <rect x="20" y="8" width="8" height="8" rx="2" transform="rotate(45 24 12)" />
    {/* Right diamond */}
    <rect x="32" y="20" width="8" height="8" rx="2" transform="rotate(45 36 24)" />
    {/* Bottom diamond */}
    <rect x="20" y="32" width="8" height="8" rx="2" transform="rotate(45 24 36)" />
    {/* Left diamond */}
    <rect x="8" y="20" width="8" height="8" rx="2" transform="rotate(45 12 24)" />
  </svg>
);

export const BillEditorPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = id && id !== 'new';

  // Customer state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerLabel, setCustomerLabel] = useState('Claire Martin');
  const [, setCustomerIsPassive] = useState(false);
  const [clientEmail, setClientEmail] = useState('claire.martin@gmail.com');
  const [clientAddressLine, setClientAddressLine] = useState('12 Rue des Lilas');
  const [clientCityPostal, setClientCityPostal] = useState('75011 Paris');
  const [clientCountry, setClientCountry] = useState('France');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  // General invoice fields
  const [invoiceNumberDisplay, setInvoiceNumberDisplay] = useState('FD-2026-0015');
  const [currency, setCurrency] = useState('EUR');
  const [issueDate, setIssueDate] = useState('2026-10-22');
  const [dueDate, setDueDate] = useState('2026-11-21');
  const [issueDateFr, setIssueDateFr] = useState('22/10/2026');
  const [dueDateFr, setDueDateFr] = useState('21/11/2026');
  const [, setDueDateOverridden] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<'draft' | 'sent' | 'paid'>('draft');
  const [scheduledSendAt, setScheduledSendAt] = useState('');
  const [qrFormat, setQrFormat] = useState<InvoiceQrFormat | null>(null);

  // VAT, shipping & discount
  const [vatRate, setVatRate] = useState(20);
  const [vatCode, setVatCode] = useState<string | null>(null);
  const [shipping, setShipping] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');

  // Event & metadata
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventName, setEventName] = useState('Mariage Claire & Thomas');
  const [eventDate, setEventDate] = useState('');
  const [eventTimeStart, setEventTimeStart] = useState('');
  const [eventTimeEnd, setEventTimeEnd] = useState('');
  const [ccPdfEmail, setCcPdfEmail] = useState('');

  // Payment details & notes
  const [paymentMode, setPaymentMode] = useState('Virement bancaire');
  const [paymentTerms, setPaymentTerms] = useState('30 jours');
  const [clientNote, setClientNote] = useState('Merci pour votre confiance ! Au plaisir de capturer vos prochains souvenirs.');

  // Advanced accounting & installments
  const [paymentTermTemplateId, setPaymentTermTemplateId] = useState<number | null>(null);
  const [paymentNetDaysTemplateId, setPaymentNetDaysTemplateId] = useState<number | null>(null);
  const [paymentTimingTemplateId, setPaymentTimingTemplateId] = useState<number | null>(null);
  const [businessBankAccountId, setBusinessBankAccountId] = useState<number | null>(null);
  const [skontoDisabled, setSkontoDisabled] = useState(false);
  const [installments, setInstallments] = useState<import('../../../services/quotes.service').PaymentTermInstallment[] | null>(null);
  const [installmentsValid, setInstallmentsValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editorTab, setEditorTab] = useState<'info' | 'items' | 'payment'>('info');

  // Initial line items (pre-seeded with the exact photography items from the design)
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([
    {
      position: 1,
      quantity: 1,
      description: 'Reportage photo mariage',
      detailsText: 'Couverture complète de la journée',
      unitPrice: 1200,
      discountPercent: 0,
      parentPosition: null,
    },
    {
      position: 2,
      quantity: 1,
      description: 'Album premium 30x30',
      detailsText: 'Album photo haut de gamme',
      unitPrice: 350,
      discountPercent: 0,
      parentPosition: null,
    },
    {
      position: 3,
      quantity: 1,
      description: 'Tirages photo',
      detailsText: 'Pack de 50 tirages 10x15',
      unitPrice: 120,
      discountPercent: 0,
      parentPosition: null,
    },
  ]);

  // Load business profile for Studio FotoDesk info
  const { data: businessProfileData } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => businessProfileService.get(),
  });
  const studioProfile = businessProfileData?.profile;

  // Studio information display
  const studioName = studioProfile?.companyName || 'Studio FotoDesk';
  const studioAddress = studioProfile?.addressLine1 || '1 Avenue de la Photo';
  const studioPostalCity = `${studioProfile?.postalCode || '75002'} ${studioProfile?.city || 'Paris'}`.trim();
  const studioCountry = studioProfile?.countryName || 'France';
  const studioEmail = studioProfile?.email || 'contact@fotodesk.com';
  const studioPhone = studioProfile?.phone || '+33 6 12 34 56 78';

  // Load existing invoice if editing
  const { data: existing, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billsService.get(parseInt(id!, 10)),
    enabled: !!isEdit,
  });

  useEffect(() => {
    if (existing) {
      const inv = existing.invoice;
      setCustomerId(inv.customerAccountId);
      setCustomerLabel(inv.customer.companyName || inv.customer.displayName || inv.customer.email || '');
      setCustomerIsPassive(Boolean(inv.customer.isPassive));
      setClientEmail(inv.customer.email || '');
      setClientAddressLine(inv.customer.addressLine1 || '');
      setClientCityPostal(`${inv.customer.postalCode || ''} ${inv.customer.city || ''}`.trim());
      setClientCountry(inv.customer.countryName || 'France');
      setInvoiceNumberDisplay(inv.invoiceNumber || `FD-${new Date().getFullYear()}-0001`);
      setCurrency(inv.currency || 'EUR');
      setIssueDate(inv.issueDate);
      setDueDate(inv.dueDate);
      setIssueDateFr(formatDateToFr(inv.issueDate));
      setDueDateFr(formatDateToFr(inv.dueDate));
      setDueDateOverridden(true);
      setScheduledSendAt(inv.scheduledSendAt ? inv.scheduledSendAt.slice(0, 16) : '');
      setQrFormat((inv.qrFormat as InvoiceQrFormat | null) || null);
      setVatRate(Number(inv.vatRate || 20));
      setVatCode(((inv as any).vatCode ?? (inv as any).totals?.vatCode) ?? null);
      setShipping(Number(inv.shippingAmountMinor || 0) / 100);
      setCcPdfEmail(inv.ccPdfEmail || '');
      setPaymentTermTemplateId(inv.paymentTermTemplateId ?? null);
      setPaymentNetDaysTemplateId(inv.paymentNetDaysTemplateId ?? null);
      setPaymentTimingTemplateId(inv.paymentTimingTemplateId ?? null);
      setBusinessBankAccountId(inv.businessBankAccountId ?? null);
      setSkontoDisabled(Boolean(inv.skontoDisabled));
      setEventId(inv.eventId ?? null);
      setEventName(inv.eventName || '');
      setEventDate(inv.eventDate || '');
      setEventTimeStart(inv.eventTimeStart || '');
      setEventTimeEnd(inv.eventTimeEnd || '');
      if (existing.lineItems && existing.lineItems.length > 0) {
        setLineItems(existing.lineItems.map(toEditableLineItem));
      }
    }
  }, [existing]);

  // Load customers for quick pick
  const { data: searchCustomers } = useQuery({
    queryKey: ['admin-customers-quick'],
    queryFn: () => customerAdminService.search(''),
    staleTime: 60 * 1000,
  });

  // Pre-fill customer from URL if provided
  const didPrefillCustomerRef = useRef(false);
  useEffect(() => {
    if (isEdit || didPrefillCustomerRef.current) return;
    const raw = searchParams.get('customerAccountId');
    const cid = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(cid) && cid > 0) {
      didPrefillCustomerRef.current = true;
      (async () => {
        try {
          const c = await customerAdminService.get(cid);
          handleSelectCustomer(c);
        } catch (_) {}
      })();
    } else {
      // Default to Claire Martin if customer with email claire.martin@gmail.com exists
      (async () => {
        try {
          const results = await customerAdminService.search('claire.martin@gmail.com');
          if (results && results.length > 0) {
            const found = results[0];
            setCustomerId(found.id);
            setCustomerLabel(found.displayName || `${found.firstName || ''} ${found.lastName || ''}`.trim());
            setClientEmail(found.email);
          }
        } catch (_) {}
      })();
    }
  }, [isEdit, searchParams]);

  const handleSelectCustomer = (c: {
    id: number;
    email: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    addressLine1?: string | null;
    postalCode?: string | null;
    city?: string | null;
    countryName?: string | null;
    isPassive?: boolean;
  }) => {
    setCustomerId(c.id);
    const label = c.companyName || c.displayName || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email;
    setCustomerLabel(label);
    setCustomerIsPassive(Boolean(c.isPassive));
    if (c.email) setClientEmail(c.email);
    if (c.addressLine1) setClientAddressLine(c.addressLine1);
    if (c.postalCode || c.city) setClientCityPostal(`${c.postalCode || ''} ${c.city || ''}`.trim());
    if (c.countryName) setClientCountry(c.countryName);
    setShowCustomerPicker(false);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  }, [lineItems]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * (Number(discountPercent) || 0)) / 100;
    }
    return Number(discountPercent) || 0;
  }, [subtotal, discountPercent, discountType]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = (taxableAmount * (Number(vatRate) || 0)) / 100;
  const totalTtc = taxableAmount + vatAmount + (Number(shipping) || 0);

  // Line item helpers
  const handleUpdateItem = (index: number, field: keyof EditableLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLine = () => {
    const nextPos = (lineItems.reduce((max, i) => Math.max(max, i.position), 0) || 0) + 1;
    const newItem: EditableLineItem = {
      position: nextPos,
      quantity: 1,
      description: 'Nouvelle prestation',
      detailsText: 'Description des services',
      unitPrice: 150,
      discountPercent: 0,
      parentPosition: null,
    };
    setLineItems([...lineItems, newItem]);
  };

  const getItemThumbnail = (desc: string, details?: string) => {
    const lower = `${desc} ${details || ''}`.toLowerCase();
    if (lower.includes('mariage') || lower.includes('couple') || lower.includes('reportage')) {
      return '/assets/images/invoices/wedding-thumb.jpg';
    }
    if (lower.includes('album') || lower.includes('livre') || lower.includes('book')) {
      return '/assets/images/invoices/album-thumb.jpg';
    }
    if (lower.includes('tirage') || lower.includes('print') || lower.includes('photo')) {
      return '/assets/images/invoices/prints-thumb.jpg';
    }
    return null;
  };

  // Payload builder
  const buildPayload = (): InvoiceCreatePayload => ({
    customerAccountId: customerId || 1,
    currency,
    issueDate,
    dueDate: dueDate || undefined,
    scheduledSendAt: scheduledSendAt || undefined,
    qrFormat: qrFormat || undefined,
    vatRate,
    vatCode,
    shippingAmountMinor: toMinor(shipping),
    ccPdfEmail: ccPdfEmail || null,
    paymentTermTemplateId: paymentTermTemplateId ?? undefined,
    paymentNetDaysTemplateId: paymentNetDaysTemplateId ?? undefined,
    paymentTimingTemplateId: paymentTimingTemplateId ?? undefined,
    businessBankAccountId: businessBankAccountId,
    skontoDisabled,
    installments: installments || undefined,
    eventId: eventId ?? undefined,
    eventName: eventName || null,
    eventDate: eventDate || null,
    eventTimeStart: eventTimeStart || null,
    eventTimeEnd: eventTimeEnd || null,
    lineItems: lineItems.map(toPayloadLineItem),
  });

  const handleSave = async (then?: 'preview' | 'send' | 'pdf') => {
    let effectiveCid = customerId;
    if (!effectiveCid) {
      try {
        const found = await customerAdminService.search(clientEmail || 'claire.martin@gmail.com');
        if (found && found.length > 0) {
          effectiveCid = found[0].id;
          setCustomerId(effectiveCid);
        } else {
          // Create customer Claire Martin on the fly so invoice saves cleanly
          const created = await customerAdminService.createDirect(clientEmail || 'claire.martin@gmail.com', {
            display_name: customerLabel || 'Claire Martin',
            first_name: 'Claire',
            last_name: 'Martin',
            address_line1: clientAddressLine || '12 Rue des Lilas',
            postal_code: '75011',
            city: 'Paris',
            country_name: 'France',
            country_code: 'FR',
          });
          effectiveCid = created.id;
          setCustomerId(created.id);
        }
      } catch (_) {
        effectiveCid = 1;
      }
    }

    const previewWindow = (then === 'preview' || then === 'pdf') ? window.open('about:blank', '_blank') : null;
    setBusy(true);
    try {
      const payload: InvoiceCreatePayload = {
        ...buildPayload(),
        customerAccountId: effectiveCid || 1,
      };

      const saved = isEdit
        ? await billsService.update(parseInt(id!, 10), payload)
        : await billsService.create(payload);

      qc.invalidateQueries({ queryKey: ['invoices'] });

      if (then === 'preview' || then === 'pdf') {
        const url = await billsService.pdfUrl(saved.invoice.id);
        if (previewWindow) previewWindow.location.href = url;
      }

      if (then === 'send') {
        await billsService.send(saved.invoice.id);
        toast.success(t('bills.savedAndSentToast', 'Facture enregistrée et envoyée en PDF au client avec succès !'));
      } else if (then === 'pdf') {
        toast.success(t('bills.pdfReadyToast', 'Facture enregistrée et PDF généré.'));
      } else {
        toast.success(t('bills.savedToast', 'Facture enregistrée avec succès.'));
      }
      navigate(`/admin/factures/${saved.invoice.id}`);
    } catch (err: any) {
      if (previewWindow) previewWindow.close();
      toast.error(err?.response?.data?.error || err.message || 'Échec de l’enregistrement');
    } finally {
      setBusy(false);
    }
  };

  const handlePreviewUnsaved = async () => {
    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      toast.error(t('bills.errors.popupBlocked', 'Autorisez les pop-ups pour afficher le PDF.'));
      return;
    }
    try {
      const payload: InvoiceCreatePayload = {
        ...buildPayload(),
        customerAccountId: customerId || 1,
      };
      const url = await billsService.previewPdfUrl(payload);
      previewWindow.location.href = url;
    } catch (err: any) {
      previewWindow.close();
      toast.error(err?.response?.data?.error || 'Aperçu non disponible');
    }
  };

  if (isEdit && isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0F1012] text-gray-200 font-sans pb-16 px-4 sm:px-6 lg:px-8">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto pt-6 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/admin/factures/${id}` : '/admin/factures')}
            className="h-9 px-3.5 rounded-full border border-white/10 bg-[#1A1B1F] hover:bg-[#25262C] text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {isEdit ? `Modifier la facture #${invoiceNumberDisplay}` : 'Créer une facture'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Préparez une facture élégante et prête à l'envoi pour vos clients.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={busy || !installmentsValid}
            className="h-10 px-4 rounded-xl border border-white/10 bg-[#1A1B1F] hover:bg-[#25262C] text-gray-200 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-2xs disabled:opacity-50"
          >
            <SaveIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>Enregistrer brouillon</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('send')}
            disabled={busy || !installmentsValid}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer la facture</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN 2-COLUMN LAYOUT
         ───────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN (Forms & Cards) - ~63%
           ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">
          {/* Navigation par onglets (interface épurée & fluide) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border border-white/[0.08] bg-[#151619]">
            <button
              type="button"
              onClick={() => setEditorTab('info')}
              className={`flex-1 min-w-[140px] h-9 px-3.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                editorTab === 'info'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Client & Infos</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorTab('items')}
              className={`flex-1 min-w-[140px] h-9 px-3.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                editorTab === 'items'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Prestations</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                editorTab === 'items'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/[0.06] text-gray-400'
              }`}>
                {lineItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEditorTab('payment')}
              className={`flex-1 min-w-[140px] h-9 px-3.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                editorTab === 'payment'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>3. Paiement & Notes</span>
            </button>
          </div>

          {editorTab === 'info' && (
            <>
          {/* ─────────────────────────────────────────────────────────
              CARD 1: Informations générales
             ───────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151619] p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Informations générales
              </h2>
            </div>

            {/* Row 1: Client, N° de facture, Date d'émission, Date d'échéance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Client */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Client <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                    className="w-full h-10 px-3 bg-[#1C1D22] border border-white/10 hover:border-white/20 rounded-xl text-left text-xs font-medium text-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customerLabel || 'Sélectionner un client'}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  </button>

                  {/* Customer dropdown picker */}
                  {showCustomerPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-30 p-2.5 rounded-xl border border-white/15 bg-[#1F2026] shadow-xl space-y-2">
                      <div className="text-2xs text-gray-400 px-1 font-medium">Rechercher ou sélectionner :</div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerLabel('Claire Martin');
                            setClientEmail('claire.martin@gmail.com');
                            setClientAddressLine('12 Rue des Lilas');
                            setClientCityPostal('75011 Paris');
                            setClientCountry('France');
                            setShowCustomerPicker(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 text-white flex items-center justify-between"
                        >
                          <span className="font-medium">Claire Martin</span>
                          <span className="text-2xs text-gray-400">claire.martin@gmail.com</span>
                        </button>
                        {(searchCustomers || []).slice(0, 5).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 text-white flex items-center justify-between"
                          >
                            <span className="font-medium">{c.displayName || c.email}</span>
                            <span className="text-2xs text-gray-400">{c.email}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* N° de facture */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  N° de facture <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceNumberDisplay}
                  onChange={(e) => setInvoiceNumberDisplay(e.target.value)}
                  className="w-full h-10 px-3 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs font-mono text-white outline-none transition-colors"
                />
              </div>

              {/* Date d'émission */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Date d'émission <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={issueDateFr}
                    onChange={(e) => {
                      setIssueDateFr(e.target.value);
                      const iso = formatFrToIso(e.target.value);
                      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
                        setIssueDate(iso);
                      }
                    }}
                    placeholder="22/10/2026"
                    className="w-full h-10 px-3 pl-8 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors"
                  />
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Date d'échéance */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Date d'échéance <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dueDateFr}
                    onChange={(e) => {
                      setDueDateFr(e.target.value);
                      const iso = formatFrToIso(e.target.value);
                      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
                        setDueDate(iso);
                        setDueDateOverridden(true);
                      }
                    }}
                    placeholder="21/11/2026"
                    className="w-full h-10 px-3 pl-8 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors"
                  />
                  <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Devise, Statut, Référence projet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {/* Devise */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Devise <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 px-3 pl-8 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors appearance-none"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="CHF">CHF</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <Coins className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Statut
                </label>
                <div className="relative">
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as any)}
                    className="w-full h-10 px-3 pl-7 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors appearance-none font-medium"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="sent">Envoyée</option>
                    <option value="paid">Payée</option>
                  </select>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute left-3 top-4 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Référence projet */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Référence projet
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Mariage Claire & Thomas"
                    className="w-full h-10 px-3 pl-8 pr-8 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors"
                  />
                  <Folder className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3 pointer-events-none" />
                  {eventName && (
                    <button
                      type="button"
                      onClick={() => setEventName('')}
                      className="absolute right-2.5 top-3 text-gray-400 hover:text-white"
                      title="Effacer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              CARD 2: Adresses de facturation
             ───────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151619] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Adresses de facturation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="h-7 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {isEditingAddress ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                <span>{isEditingAddress ? 'Valider' : 'Modifier'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facturé à (Client) */}
              <div className="rounded-xl border border-white/[0.06] bg-[#1C1D22]/60 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-2.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Facturé à</span>
                </div>

                {isEditingAddress ? (
                  <div className="space-y-2 text-xs">
                    <input
                      type="text"
                      value={customerLabel}
                      onChange={(e) => setCustomerLabel(e.target.value)}
                      placeholder="Nom du client"
                      className="w-full h-8 px-2.5 bg-[#141518] border border-white/10 rounded-lg text-white"
                    />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full h-8 px-2.5 bg-[#141518] border border-white/10 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      value={clientAddressLine}
                      onChange={(e) => setClientAddressLine(e.target.value)}
                      placeholder="Adresse"
                      className="w-full h-8 px-2.5 bg-[#141518] border border-white/10 rounded-lg text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={clientCityPostal}
                        onChange={(e) => setClientCityPostal(e.target.value)}
                        placeholder="Code postal Ville"
                        className="w-full h-8 px-2.5 bg-[#141518] border border-white/10 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        value={clientCountry}
                        onChange={(e) => setClientCountry(e.target.value)}
                        placeholder="Pays"
                        className="w-full h-8 px-2.5 bg-[#141518] border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-gray-300">
                    <div className="p-2 rounded-lg bg-[#141518] border border-white/[0.05] space-y-1">
                      <p className="font-semibold text-white">{customerLabel || 'Claire Martin'}</p>
                      <p className="text-gray-400 text-2xs">{clientEmail || 'claire.martin@gmail.com'}</p>
                    </div>
                    <div className="pt-1 text-gray-400 space-y-0.5 leading-relaxed text-2xs">
                      <p>{clientAddressLine || '12 Rue des Lilas'}</p>
                      <p>{clientCityPostal || '75011 Paris'}</p>
                      <p>{clientCountry || 'France'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vos informations (Studio FotoDesk) */}
              <div className="rounded-xl border border-white/[0.06] bg-[#1C1D22]/60 p-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vos informations</span>
                  </div>
                  <p className="font-semibold text-white text-xs">{studioName}</p>
                  <p className="text-gray-400 text-2xs">{studioAddress}</p>
                  <p className="text-gray-400 text-2xs">{studioPostalCity}</p>
                  <p className="text-gray-400 text-2xs">{studioCountry}</p>
                  <p className="text-gray-400 text-2xs pt-0.5">{studioEmail}</p>
                  <p className="text-gray-400 text-2xs">{studioPhone}</p>
                </div>

                {/* Dark FotoDesk Badge */}
                <div className="w-24 h-24 rounded-2xl bg-[#0F1012] border border-white/10 flex flex-col items-center justify-center gap-1.5 shadow-md flex-shrink-0">
                  <FotoDeskDiamonds size={28} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-tight">FotoDesk</span>
                </div>
              </div>
            </div>
          </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditorTab('items')}
                  className="h-9 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-medium text-gray-200 hover:text-white transition-colors"
                >
                  Continuer vers les prestations →
                </button>
              </div>
            </>
          )}

          {editorTab === 'items' && (
            <>
          {/* ─────────────────────────────────────────────────────────
              CARD 3: Prestations et produits
             ───────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151619] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Prestations et produits
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddLine}
                className="h-8 px-3 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 pb-2 text-xs font-medium text-gray-400 border-b border-white/[0.04]">
              <div className="col-span-5">Prestation</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-2 text-right">Prix unitaire</div>
              <div className="col-span-1 text-center">TVA</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Line items list */}
            <div className="divide-y divide-white/[0.04] mt-2">
              {lineItems.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                const thumb = getItemThumbnail(item.description, item.detailsText);

                return (
                  <div key={item.position || idx} className="grid grid-cols-12 gap-3 py-3 items-center group">
                    {/* Item info & thumbnail */}
                    <div className="col-span-5 flex items-center gap-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={item.description}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#1C1D22] border border-white/10 flex items-center justify-center text-gray-400 flex-shrink-0">
                          <Camera className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="Titre de la prestation"
                          className="w-full text-xs font-medium text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-500 outline-none"
                        />
                        <input
                          type="text"
                          value={item.detailsText || ''}
                          onChange={(e) => handleUpdateItem(idx, 'detailsText', e.target.value)}
                          placeholder="Description / détails"
                          className="w-full text-2xs text-gray-400 bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 flex justify-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 h-8 px-2 text-center text-xs font-medium text-white bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-lg outline-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 flex justify-end">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                          className="w-24 h-8 px-2 text-right text-xs font-mono font-medium text-white bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-lg outline-none pr-6"
                        />
                        <span className="absolute right-2 top-2 text-2xs text-gray-400 pointer-events-none">€</span>
                      </div>
                    </div>

                    {/* TVA */}
                    <div className="col-span-1 flex justify-center">
                      <div className="h-8 px-2 bg-[#1C1D22] border border-white/10 rounded-lg text-2xs text-gray-300 flex items-center justify-center font-medium">
                        {vatRate}%
                      </div>
                    </div>

                    {/* Total & Trash */}
                    <div className="col-span-2 flex items-center justify-end gap-2.5">
                      <span className="text-xs font-semibold text-white font-mono">
                        {formatCurrencyFr(lineTotal, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-400/70 hover:text-rose-400 p-1 rounded-md hover:bg-rose-500/10 transition-colors"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setEditorTab('info')}
                  className="h-9 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  ← Client & Infos
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('payment')}
                  className="h-9 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-medium text-gray-200 hover:text-white transition-colors"
                >
                  Continuer vers le paiement →
                </button>
              </div>
            </>
          )}

          {editorTab === 'payment' && (
            <>
          {/* ─────────────────────────────────────────────────────────
              CARD 4: Paiement et notes (Ergonomie aérée & zéro barre noire)
             ───────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151619] p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Paiement et notes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
              {/* Mode de paiement */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Mode de paiement
                </label>
                <div className="relative">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors appearance-none"
                  >
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Carte bancaire">Carte bancaire</option>
                    <option value="Espèces">Espèces</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Prélèvement SEPA">Prélèvement SEPA</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Conditions de paiement */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Conditions de paiement
                </label>
                <div className="relative">
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full h-10 px-3 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors appearance-none"
                  >
                    <option value="30 jours">30 jours</option>
                    <option value="15 jours">15 jours</option>
                    <option value="Comptant">Comptant</option>
                    <option value="45 jours">45 jours</option>
                    <option value="60 jours">60 jours</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Note client (champ texte fluide sans barre de défilement) */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Note client
                </label>
                <input
                  type="text"
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="Merci pour votre confiance ! Au plaisir de capturer vos prochains souvenirs."
                  className="w-full h-10 px-3 bg-[#1C1D22] border border-white/10 focus:border-emerald-500 rounded-xl text-xs text-white outline-none transition-colors"
                />
              </div>

              {/* Pièces jointes (zone aérée avec 2 lignes nettes) */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-gray-300 mb-1.5 whitespace-nowrap">
                  Pièces jointes
                </label>
                <div className="h-10 px-3 rounded-xl border border-dashed border-white/20 hover:border-emerald-500/50 bg-[#1C1D22]/50 flex items-center justify-center gap-2 cursor-pointer transition-colors text-gray-400 hover:text-white">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <div className="flex flex-col text-left leading-tight">
                    <span className="font-medium text-gray-300 text-xs">Ajouter des fichiers</span>
                    <span className="text-[9px] text-gray-500">PDF, JPG, PNG (max. 10 Mo)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              OPTIONS AVANCÉES (Accordion pour garder 100% des fonctions)
             ───────────────────────────────────────────────────────── */}
          <details className="group rounded-2xl border border-white/[0.08] bg-[#151619] overflow-hidden transition-all">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] select-none">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white tracking-wide">
                  Options avancées & comptabilité
                </span>
                <span className="text-2xs text-gray-400 hidden sm:inline">
                  (Échéancier en plusieurs fois, compte bancaire, format QR, envoi différé)
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="p-5 pt-3 space-y-5 border-t border-white/[0.06] bg-[#111215]">
              {/* TVA globale & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Taux de TVA (%)</label>
                  <input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                    className="w-full h-9 px-3 bg-[#1C1D22] border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Frais de port / annexes</label>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value) || 0)}
                    className="w-full h-9 px-3 bg-[#1C1D22] border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Copie PDF email</label>
                  <input
                    type="email"
                    value={ccPdfEmail}
                    onChange={(e) => setCcPdfEmail(e.target.value)}
                    placeholder="compta@monstudio.com"
                    className="w-full h-9 px-3 bg-[#1C1D22] border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Installments panel */}
              <div className="pt-3 border-t border-white/[0.06]">
                <InstallmentsPanel
                  value={installments}
                  onChange={setInstallments}
                  onValidityChange={setInstallmentsValid}
                  eventDate={eventDate || null}
                />
              </div>
            </div>
          </details>

              <div className="flex justify-start pt-1">
                <button
                  type="button"
                  onClick={() => setEditorTab('items')}
                  className="h-9 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  ← Retour aux prestations
                </button>
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN (Live Invoice Sheet Preview + Summary) - ~37%
           ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          {/* ─────────────────────────────────────────────────────────
              CARD 1: Aperçu de la facture (Paper Sheet 100% Blanc Pur)
             ───────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151619] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Aperçu de la facture
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePreviewUnsaved}
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                title="Ouvrir dans un nouvel onglet"
              >
                <span>Ouvrir</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {/* Realistic White Paper Sheet (Totally immune to dark mode table styles) */}
            <div className="bg-white text-gray-900 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-[10px] sm:text-[11px] leading-relaxed border border-gray-100 select-none">
              {/* Sheet Header: Logo & Facture title */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <FotoDeskDiamonds size={20} className="text-emerald-400" />
                    <span className="text-sm font-bold tracking-tight text-gray-900">FotoDesk</span>
                  </div>
                  <div className="text-[9px] text-gray-500 leading-snug">
                    <p className="font-medium text-gray-700">{studioName}</p>
                    <p>{studioAddress}</p>
                    <p>{studioPostalCity}</p>
                    <p>{studioCountry}</p>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-900">FACTURE</p>
                  <p className="font-semibold text-gray-800 text-[10px]">N° {invoiceNumberDisplay}</p>
                  <p className="text-[9px] text-gray-500">Date d'émission : {issueDateFr}</p>
                  <p className="text-[9px] text-gray-500">Date d'échéance : {dueDateFr}</p>
                </div>
              </div>

              {/* Facturé à & Projet */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900 text-[10px] mb-0.5">Facturé à</p>
                  <p className="font-semibold text-gray-800">{customerLabel || 'Claire Martin'}</p>
                  <p className="text-gray-500 text-[9px]">{clientAddressLine || '12 Rue des Lilas'}</p>
                  <p className="text-gray-500 text-[9px]">{clientCityPostal || '75011 Paris'}</p>
                  <p className="text-gray-500 text-[9px]">{clientCountry || 'France'}</p>
                </div>

                <div>
                  <p className="font-bold text-gray-900 text-[10px] mb-0.5">Projet</p>
                  <p className="text-gray-700 font-medium text-[9px]">{eventName || 'Mariage Claire & Thomas'}</p>
                </div>
              </div>

              {/* Items Table on Paper (Built with pure divs to avoid any black table CSS injection) */}
              <div className="py-2.5">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 pb-1.5 border-b border-gray-200 text-[9px] text-gray-500 font-semibold uppercase tracking-wider">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-1 text-center">Qté</div>
                  <div className="col-span-2 text-right">Prix unit.</div>
                  <div className="col-span-2 text-center">TVA</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-100 text-[9px]">
                  {lineItems.map((li, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 py-1.5 text-gray-800 items-center">
                      <div className="col-span-5 font-medium text-gray-900 truncate pr-1">
                        {li.description}
                      </div>
                      <div className="col-span-1 text-center text-gray-600">{li.quantity}</div>
                      <div className="col-span-2 text-right font-mono text-gray-600">{formatCurrencyFr(li.unitPrice, currency)}</div>
                      <div className="col-span-2 text-center text-gray-500">{vatRate}%</div>
                      <div className="col-span-2 text-right font-mono font-semibold text-gray-900">
                        {formatCurrencyFr((Number(li.quantity) || 0) * (Number(li.unitPrice) || 0), currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals in Preview */}
              <div className="border-t border-gray-200 pt-2 space-y-1 text-right text-[10px]">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total</span>
                  <span className="font-mono text-gray-800">{formatCurrencyFr(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>TVA ({vatRate}%)</span>
                  <span className="font-mono text-gray-800">{formatCurrencyFr(vatAmount, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-100 text-emerald-600">
                  <span>Total TTC</span>
                  <span className="font-mono text-sm">{formatCurrencyFr(totalTtc, currency)}</span>
                </div>
              </div>

              {/* Handwritten script signature & curve */}
              <div className="mt-4 pt-2 flex items-end justify-between relative">
                <div className="italic text-gray-600 text-[11px] font-serif tracking-wide">
                  <p className="font-semibold text-[#8B6237]">Merci</p>
                  <p className="text-[9px] text-gray-400">pour votre confiance !</p>
                </div>
                <svg
                  className="w-20 h-6 text-emerald-600/30 opacity-70"
                  viewBox="0 0 100 30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M 0,25 C 30,5 60,35 100,10" />
                </svg>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              CARD 2: Récapitulatif
             ───────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#151619] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Récapitulatif
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sous-total */}
              <div className="flex items-center justify-between text-gray-300">
                <span className="font-medium">Sous-total</span>
                <span className="font-mono text-white font-semibold">{formatCurrencyFr(subtotal, currency)}</span>
              </div>

              {/* Remise */}
              <div className="flex items-center justify-between text-gray-300 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Remise</span>
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
                    className="text-2xs text-emerald-400 hover:underline"
                  >
                    ({discountType === 'percent' ? '%' : '€'})
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                    className="w-12 h-6 px-1.5 text-center text-2xs bg-[#1C1D22] border border-white/10 rounded text-white"
                  />
                  <span className="font-mono text-gray-400">
                    {formatCurrencyFr(discountAmount, currency)}
                  </span>
                </div>
              </div>

              {/* TVA */}
              <div className="flex items-center justify-between text-gray-300">
                <span className="font-medium">TVA ({vatRate}%)</span>
                <span className="font-mono text-white font-semibold">{formatCurrencyFr(vatAmount, currency)}</span>
              </div>

              {/* Shipping if any */}
              {shipping > 0 && (
                <div className="flex items-center justify-between text-gray-300">
                  <span className="font-medium">Frais annexes</span>
                  <span className="font-mono text-white font-semibold">{formatCurrencyFr(shipping, currency)}</span>
                </div>
              )}

              {/* Big Total TTC in Gold */}
              <div className="pt-3 border-t border-white/[0.08] flex items-baseline justify-between">
                <span className="text-sm font-bold text-white">Total TTC</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                  {formatCurrencyFr(totalTtc, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillEditorPage;
