/**
 * Settings → CRM tab.
 *
 * Per-feature toggles that fine-tune the CRM behaviour without turning
 * off the whole `quotes` / `bills` global flag.  Backed by the
 * crm_* settings seeded by migration 102.  Reads via the generic
 * settings.service; writes one key at a time to keep blast radius small.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Loading, Input } from '../../../components/common';
import { SettingsSaveBar } from '../../../components/admin/SettingsSaveBar';
import { settingsService } from '../../../services/settings.service';
import { quotesService } from '../../../services/quotes.service';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { useMutationWithToast } from '../../../hooks';
import { ALL_DOCUMENT_FORMATS, normaliseFormats } from '../../../utils/documentFormats';

const SETTING_KEYS = [
  'crm_quotes_pdf_attachment_enabled',
  'crm_quotes_skonto_enabled',
  'crm_quotes_accept_window_minutes',
  'crm_quotes_default_valid_days',
  'crm_quotes_number_format',
  // Terms of Service step on quote acceptance (migration 104).
  'crm_quotes_tos_required',
  'crm_quotes_tos_text',
  'crm_quotes_tos_url',
  'crm_invoices_qr_enabled',
  'crm_invoice_round_total',
  // Free-text VAT/legal note printed under the MwSt. line on invoice PDFs (#794).
  'crm_invoices_vat_note_text',
  // What the Leistungsdatum row does when the service date is the invoice date (#1546).
  'crm_invoices_service_date_mode',
  'crm_invoices_reminders_enabled',
  'crm_invoices_reminder_first_days',
  'crm_invoices_reminder_second_days',
  'crm_invoices_late_fee_enabled',
  'crm_invoices_late_fee_type',
  'crm_invoices_late_fee_minor',
  'crm_invoices_late_fee_percent',
  'crm_invoices_late_fee_vat_enabled',
  'crm_invoices_late_fee_label',
  'crm_invoices_skonto_business_days',
  'crm_invoices_skonto_percent_default',
  // Installment defaults (migration 141) — pre-populate fresh ad-hoc
  // rows in the Quote / Invoice editors' Installments panel.
  'crm_invoices_installment_trigger_first',
  'crm_invoices_installment_days_before_event',
  'crm_invoices_installment_days_after_event',
  // Pre-event customer reminders (migration 143) — toggles managed
  // on Settings → Reminder emails (their own dedicated tab) so the
  // template editor and the global enable/days-before settings live
  // in one place.
  'crm_invoices_number_format',
  // Default Net days + Payment timing pickers (migration 124+125).
  // The per-quote/per-invoice picker becomes a true override over
  // these global defaults — the editor reads these on new documents.
  'crm_invoices_default_payment_net_days_template_id',
  'crm_invoices_default_payment_timing_template_id',
  // Contracts (migration 130). Number format token convention matches
  // quotes/invoices: {YEAR} {MONTH} {SEQ:04d}. Default 'C-{YEAR}-{SEQ:04d}'.
  'crm_contracts_number_format',
  'crm_contracts_default_valid_days',
  'crm_contracts_pdf_attachment_enabled',
  'crm_contracts_require_drawn_signature',
  'crm_contracts_allow_pdf_upload',
  'crm_contracts_store_ip',
  // Signatures (#1446): an admin notice for every signature, not only once
  // every customer has signed. Default on.
  'crm_contracts_notify_each_signature',
  // Reminder ladder for unsigned signers (#1446): days after the last link,
  // comma-separated. Default "3,7"; empty = off.
  'crm_contracts_reminder_days',
  // Alert thresholds for probing of the signing links (#1446).
  'crm_contracts_alert_unknown_tokens_per_ip',
  'crm_contracts_alert_otp_failures_per_contract',
  'crm_contracts_alert_unknown_tokens_per_hour',
  // The legal notice frozen into every contract at send (#1446), { en, de }.
  'crm_contracts_legal_notice',
  // Dashboard CRM-overview tile visibility (per-tile). Default ON;
  // explicit false hides the tile. Stored as one boolean per tile so
  // admins can mix-and-match — e.g. someone who only bills hourly
  // hides the quotes pipeline + the per-status invoice breakdown
  // but keeps the revenue / outstanding tiles.
  'crm_overview_show_revenue',
  'crm_overview_show_outstanding',
  'crm_overview_show_quotes',
  'crm_overview_show_invoices',
  // Customer documents in the portal (#1444, migrations 225 + 240).
  'customer_documents_max_upload_size_mb',
  'customer_documents_quota_mb',
  'customer_documents_retention_days',
  'customer_documents_notify_on_share',
  'customer_documents_forbidden_alert_threshold',
  'customer_documents_request_reminder_days',
  'customer_documents_allowed_formats',
];

export const CrmSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { flags } = useFeatureFlags();
  // Show each section only when the corresponding master flag is on —
  // configuring Skonto on quotes is pointless when quotes itself is
  // disabled. The dashboard-overview tile section depends on quotes
  // OR bills (the per-tile checkboxes inside govern quote-pipeline +
  // invoice-pipeline + revenue tiles, all of which are CRM-money).
  const showInvoices = !!flags.bills;
  const workflowsLive = !!flags.workflows;
  const showDashboardOverview = !!flags.bills;
  const showDocuments = !!flags.documents;
  const anySection = showInvoices || showDashboardOverview || showDocuments;
  const subtitleAreas = [
    showInvoices && t('crmSettings.areas.invoices', 'invoices'),
    showDocuments && t('crmSettings.areas.documents', 'customer documents'),
  ].filter((a): a is string => !!a);
  // Joined with a translated "and" rather than Intl.ListFormat: a partial
  // locale falls back to the English area names, and its own conjunction
  // would then read "quotes et invoices".
  const andWord = t('crmSettings.areas.and', 'and');
  const areaList = subtitleAreas.length > 1
    ? `${subtitleAreas.slice(0, -1).join(', ')} ${andWord} ${subtitleAreas[subtitleAreas.length - 1]}`
    : subtitleAreas[0];
  const subtitle = subtitleAreas.length
    ? t('crmSettings.subtitleFor', 'Settings for {{areas}}.', { areas: areaList, interpolation: { escapeValue: false } })
    : t('crmSettings.subtitle', 'Fine-tune quote and invoice behaviour.');
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'crm'],
    queryFn: async () => {
      const all = await settingsService.getAllSettings();
      const out: Record<string, any> = {};
      for (const key of SETTING_KEYS) out[key] = all[key];
      return out;
    },
  });

  // Migration 124 — list the split-picker templates so the new
  // dropdowns can render labels. Same endpoints the editors use.
  const { data: netDaysTemplates } = useQuery({
    queryKey: ['payment-net-days-templates'],
    queryFn: () => quotesService.listPaymentNetDaysTemplates(),
  });
  const { data: timingTemplates } = useQuery({
    queryKey: ['payment-timing-templates'],
    queryFn: () => quotesService.listPaymentTimingTemplates(),
  });

  const [values, setValues] = useState<Record<string, any>>({});
  // What the server last sent, in draft shape — dirty is a comparison against it.
  const [loaded, setLoaded] = useState<Record<string, any>>({});
  useEffect(() => { if (data) { setValues(data); setLoaded(data); } }, [data]);
  const isDirty = JSON.stringify(values) !== JSON.stringify(loaded);

  const saveAll = useMutationWithToast({
    mutationFn: async () => {
      const changed: Record<string, any> = {};
      for (const key of SETTING_KEYS) {
        if (values[key] !== data?.[key]) changed[key] = values[key];
      }
      if (Object.keys(changed).length > 0) {
        await settingsService.updateSettings(changed);
      }
    },
    successMessage: t('crmSettings.savedToast', 'CRM settings saved.'),
    invalidateKeys: [['settings', 'crm']],
    errorMessage: 'Save failed',
    onSuccess: () => setLoaded(values),
  });

  if (isLoading) return <Loading />;

  const setVal = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));
  const checkbox = (k: string, label: string) => (
    <label className="flex items-center gap-2 text-sm text-body py-1">
      <input type="checkbox" checked={!!values[k]} onChange={(e) => setVal(k, e.target.checked)} />
      <span>{t(`crmSettings.${k}.label`, label)}</span>
    </label>
  );
  /**
   * Checkbox variant for settings whose backend semantics treat
   * `undefined` (row missing from app_settings) as ON — e.g.
   * `crm_contracts_allow_pdf_upload` reads `getAppSetting(...) !== false`,
   * so a missing row behaves as if checked. Without this variant the
   * UI would render an unchecked box while the feature is actually
   * running, which misleads admins on installs whose DB ran an earlier
   * version of migration 130 (before these settings were added to the
   * seed list).
   *
   * Stored booleans (true / false) always win; the default only fills
   * in when the value is null/undefined.
   */
  const checkboxDefaultOn = (k: string, label: string) => {
    const stored = values[k];
    const effective = stored === undefined || stored === null ? true : !!stored;
    return (
      <label className="flex items-center gap-2 text-sm text-body py-1">
        <input
          type="checkbox"
          checked={effective}
          onChange={(e) => setVal(k, e.target.checked)}
        />
        <span>{t(`crmSettings.${k}.label`, label)}</span>
      </label>
    );
  };

  return (
    <div className="space-y-4">
      {/* No tab title here — the Settings shell renders the section
          heading (icon + label + divider) for every tab that isn't in
          SettingsPage's TABS_WITH_OWN_HEADER, so a page title repeated
          the nav label the admin just clicked (QA warning). The subtitle
          stays. */}
      <p className="text-sm text-soft">
        {subtitle}
      </p>

      {!anySection && (
        <Card>
          <p className="text-sm text-muted">
            {t('crmSettings.emptyState',
              'No CRM features are currently enabled. Turn on Quotes, Invoices, or Contracts in Settings → Features to see the matching configuration here.')}
          </p>
        </Card>
      )}

      {showInvoices && (
      <Card>
        <h3 className="font-semibold text-heading mb-3">{t('crmSettings.section.invoices', 'Invoices')}</h3>
        {checkbox('crm_invoices_qr_enabled', 'Render payment QR on invoice PDFs')}
        {checkbox('crm_invoice_round_total', 'Reconcile sub-cent rounding to a clean total (adds a "Rundung" row when per-line rounding drifts from qty × rate)')}

        {/* Free-text VAT / legal note (#794) — printed directly under the MwSt.
            line on every invoice PDF. Data-driven: the admin types the exact
            wording (Austrian Kleinunternehmer, German §19, reverse-charge, …). */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-body mb-1">
            {t('crmSettings.crm_invoices_vat_note_text.label', 'VAT / free-text note on invoices')}
          </label>
          <textarea
            value={values.crm_invoices_vat_note_text ?? ''}
            onChange={(e) => setVal('crm_invoices_vat_note_text', e.target.value)}
            rows={2}
            placeholder={t('crmSettings.crm_invoices_vat_note_text.placeholder', 'e.g. Gemäß § 6 Abs. 1 Z 27 UStG 1994 wird keine Umsatzsteuer berechnet (Kleinunternehmer).') as string}
            className="w-full px-3 py-2 rounded-lg border border-line-strong bg-shell text-heading"
          />
          <p className="mt-1 text-xs text-muted">
            {t('crmSettings.crm_invoices_vat_note_text.help', 'Printed directly under the MwSt. line on every invoice PDF. If the business isn\'t VAT-registered (Settings → Accounting), it replaces that line on invoices without VAT. Quotes never carry it — an offer is not the tax document. Leave empty to hide. Please confirm the exact wording with your tax advisor.')}
          </p>
        </div>

        {/* Leistungsdatum when the service date IS the invoice date (#1546).
            The time of supply belongs on the document (MWSTG Art. 26, §14(4)
            Nr. 6 UStG), but printing the same date twice reads as a mistake —
            so the default states it in words. */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-body mb-1">
            {t('crmSettings.crm_invoices_service_date_mode.label', 'Service date equal to the invoice date')}
          </label>
          <select
            value={values.crm_invoices_service_date_mode ?? 'note'}
            onChange={(e) => setVal('crm_invoices_service_date_mode', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-line-strong bg-shell text-heading"
          >
            <option value="note">{t('crmSettings.crm_invoices_service_date_mode.note', 'State it in words ("same as invoice date")')}</option>
            <option value="repeat">{t('crmSettings.crm_invoices_service_date_mode.repeat', 'Print the date again')}</option>
            <option value="omit">{t('crmSettings.crm_invoices_service_date_mode.omit', 'Leave the row out')}</option>
          </select>
          <p className="mt-1 text-xs text-muted">
            {t('crmSettings.crm_invoices_service_date_mode.help', 'Only applies when the service date falls on the invoice date; a service period always prints. Tax law in CH/LI and DE/AT wants the time of supply on the invoice, so leaving the row out is a decision to confirm with your tax advisor.')}
          </p>
        </div>

        {!workflowsLive && checkbox('crm_invoices_reminders_enabled', 'Send automatic reminders for overdue invoices')}

        {checkbox('crm_invoices_late_fee_enabled', 'Add a late fee (Mahngebühr) on every reminder after the first')}
        {checkbox('crm_invoices_late_fee_vat_enabled', 'Charge VAT on late fees (Switzerland — leave off for DE/AT; no effect if your organisation has no VAT rate)')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {!workflowsLive && (
            <>
              <Input type="number" min={1} max={365}
                label={t('crmSettings.crm_invoices_reminder_first_days.label', 'First reminder after (days past due)') as string}
                value={values.crm_invoices_reminder_first_days ?? 14}
                onChange={(e) => setVal('crm_invoices_reminder_first_days', Number(e.target.value))} />
              <Input type="number" min={1} max={365}
                label={t('crmSettings.crm_invoices_reminder_second_days.label', 'Second reminder after (days past due)') as string}
                value={values.crm_invoices_reminder_second_days ?? 30}
                onChange={(e) => setVal('crm_invoices_reminder_second_days', Number(e.target.value))} />
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-body mb-1">
              {t('crmSettings.crm_invoices_late_fee_type.label', 'Late fee type')}
            </label>
            <select
              value={values.crm_invoices_late_fee_type ?? 'flat'}
              onChange={(e) => setVal('crm_invoices_late_fee_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-line-strong bg-shell text-heading"
            >
              <option value="flat">{t('crmSettings.lateFeeType.flat', 'Flat amount (Rappen)')}</option>
              <option value="percent">{t('crmSettings.lateFeeType.percent', 'Percentage of invoice')}</option>
            </select>
          </div>
          {(values.crm_invoices_late_fee_type ?? 'flat') === 'percent' ? (
            <Input type="number" min={0} step="0.01" max={100}
              label={t('crmSettings.crm_invoices_late_fee_percent.label', 'Late fee (% of invoice)') as string}
              value={values.crm_invoices_late_fee_percent ?? 0}
              onChange={(e) => setVal('crm_invoices_late_fee_percent', Number(e.target.value))} />
          ) : (
            <Input type="number" min={0}
              label={t('crmSettings.crm_invoices_late_fee_minor.label', 'Late fee (minor units / Rappen)') as string}
              value={values.crm_invoices_late_fee_minor ?? 0}
              onChange={(e) => setVal('crm_invoices_late_fee_minor', Number(e.target.value))} />
          )}
          <Input
            label={t('crmSettings.crm_invoices_late_fee_label.label', 'Late fee label') as string}
            value={values.crm_invoices_late_fee_label ?? 'Mahngebühr'}
            onChange={(e) => setVal('crm_invoices_late_fee_label', e.target.value)} />
          <Input type="number" min={0} step="0.01" max="100"
            label={t('crmSettings.crm_invoices_skonto_percent_default.label', 'Skonto rate (default %)') as string}
            value={values.crm_invoices_skonto_percent_default ?? 2}
            onChange={(e) => setVal('crm_invoices_skonto_percent_default', Number(e.target.value))} />
          <Input type="number" min={0}
            label={t('crmSettings.crm_invoices_skonto_business_days.label', 'Skonto window (business days)') as string}
            value={values.crm_invoices_skonto_business_days ?? 5}
            onChange={(e) => setVal('crm_invoices_skonto_business_days', Number(e.target.value))} />
          <Input
            label={t('crmSettings.crm_invoices_number_format.label', 'Invoice number format') as string}
            value={values.crm_invoices_number_format ?? ''}
            onChange={(e) => setVal('crm_invoices_number_format', e.target.value)} />
        </div>

        {/* Installment defaults (migration 141). Pre-populate fresh
            ad-hoc rows in the Quote / Invoice editors' Installments
            panel — admins type these defaults exactly once instead of
            on every new multi-installment plan. Per-document edits
            still override. */}
        <div className="mt-4 pt-4 border-t border-line">
          <h4 className="font-semibold text-heading mb-2 text-sm">
            {t('crmSettings.section.installmentDefaults', 'Default installment triggers')}
          </h4>
          <p className="text-xs text-neutral-500 mb-3">
            {t('crmSettings.installmentDefaults.help',
              'Pre-fill the trigger for fresh rows in the Installments panel. Per-document edits override; existing documents keep their snapshotted plan.')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                {t('crmSettings.crm_invoices_installment_trigger_first.label', 'First installment trigger')}
              </label>
              <select
                value={values.crm_invoices_installment_trigger_first ?? 'quote_accepted'}
                onChange={(e) => setVal('crm_invoices_installment_trigger_first', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-line-strong bg-panel text-heading text-sm"
              >
                <option value="quote_accepted">{t('crmSettings.installmentDefaults.trigger.quote_accepted', 'At signing / creation')}</option>
                <option value="before_event">{t('crmSettings.installmentDefaults.trigger.before_event', 'Before event')}</option>
                <option value="after_event">{t('crmSettings.installmentDefaults.trigger.after_event', 'After event')}</option>
                <option value="after_delivery">{t('crmSettings.installmentDefaults.trigger.after_delivery', 'On delivery (manual release)')}</option>
                <option value="fixed_date">{t('crmSettings.installmentDefaults.trigger.fixed_date', 'Fixed date')}</option>
              </select>
            </div>
            <Input type="number" min={0}
              label={t('crmSettings.crm_invoices_installment_days_before_event.label', 'Days before event (middle installment)') as string}
              value={values.crm_invoices_installment_days_before_event ?? 14}
              onChange={(e) => setVal('crm_invoices_installment_days_before_event', Number(e.target.value))} />
            <Input type="number" min={0}
              label={t('crmSettings.crm_invoices_installment_days_after_event.label', 'Days after event (final installment)') as string}
              value={values.crm_invoices_installment_days_after_event ?? 14}
              onChange={(e) => setVal('crm_invoices_installment_days_after_event', Number(e.target.value))} />
          </div>
        </div>

        {/* Pre-event customer reminders moved to their own dedicated
            tab — Settings → Reminder emails — modelled on the
            BlockLibrary two-column layout. Toggles + per-type
            templates live there in one place. */}

        {/* Default payment-term pickers (migration 124+125). The
            per-quote / per-invoice editor still always shows the
            pickers — admin can override per document — but new
            drafts auto-prefill from these two settings. */}
        <div className="mt-4 pt-4 border-t border-line">
          <h4 className="font-semibold text-heading mb-2 text-sm">
            {t('crmSettings.section.paymentDefaults', 'Default payment conditions')}
          </h4>
          <p className="text-xs text-neutral-500 mb-3">
            {t('crmSettings.paymentDefaults.help',
              'Pre-filled on every new quote and invoice. The editor still lets you pick a different combination per document.')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                {t('crmSettings.crm_invoices_default_payment_net_days_template_id.label', 'Default net days')}
              </label>
              <select
                className="w-full px-3 py-2 rounded-md border border-line-strong bg-panel text-heading text-sm"
                value={values.crm_invoices_default_payment_net_days_template_id ?? ''}
                onChange={(e) => setVal('crm_invoices_default_payment_net_days_template_id', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('crmSettings.paymentDefaults.none', '— No default —')}</option>
                {netDaysTemplates?.templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                {t('crmSettings.crm_invoices_default_payment_timing_template_id.label', 'Default payment schedule')}
              </label>
              <select
                className="w-full px-3 py-2 rounded-md border border-line-strong bg-panel text-heading text-sm"
                value={values.crm_invoices_default_payment_timing_template_id ?? ''}
                onChange={(e) => setVal('crm_invoices_default_payment_timing_template_id', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{t('crmSettings.paymentDefaults.none', '— No default —')}</option>
                {timingTemplates?.templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </Card>
      )}

      {showDocuments && (
      /* Customer documents (#1444). The limits are read by
         customerDocumentsService.getLimits / getRetentionDays, which fall
         back to their defaults for an empty or invalid value. */
      <Card>
        <h3 className="font-semibold text-heading mb-1">
          {t('crmSettings.section.documents', 'Customer documents')}
        </h3>
        <p className="text-xs text-neutral-500 mb-3">
          {t('crmSettings.section.documentsHint',
            'Documents exchanged with customers in their portal. Customer uploads stay unavailable to them until reviewed.')}
        </p>
        {checkboxDefaultOn('customer_documents_notify_on_share', 'Email the customer when a document is shared with them (default for the checkbox on the customer record)')}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <Input type="number" min={1} max={500}
            label={t('crmSettings.customer_documents_max_upload_size_mb.label', 'Largest file (MB)') as string}
            value={values.customer_documents_max_upload_size_mb ?? 25}
            onChange={(e) => setVal('customer_documents_max_upload_size_mb', Number(e.target.value))} />
          <Input type="number" min={1} max={100000}
            label={t('crmSettings.customer_documents_quota_mb.label', 'Storage per customer (MB)') as string}
            value={values.customer_documents_quota_mb ?? 250}
            onChange={(e) => setVal('customer_documents_quota_mb', Number(e.target.value))} />
          <Input type="number" min={1} max={3650}
            label={t('crmSettings.customer_documents_retention_days.label', 'Keep rejected and deleted files (days)') as string}
            value={values.customer_documents_retention_days ?? 30}
            onChange={(e) => setVal('customer_documents_retention_days', Number(e.target.value))} />
          <Input type="number" min={1} max={10000}
            label={t('crmSettings.customer_documents_forbidden_alert_threshold.label', 'Alert after attempts on other customers\' documents (per hour)') as string}
            value={values.customer_documents_forbidden_alert_threshold ?? 20}
            onChange={(e) => setVal('customer_documents_forbidden_alert_threshold', Number(e.target.value))} />
        </div>
        {/* The formats are a fixed, inspected allowlist (backend
            services/documentFormats); this picks which of them the install
            accepts. PDF is the default. */}
        <fieldset className="mt-3">
          <legend className="text-sm font-medium text-body mb-1">
            {t('crmSettings.customer_documents_allowed_formats.label', 'File types customers can upload')}
          </legend>
          <p className="text-xs text-neutral-500 mb-2">
            {t('crmSettings.customer_documents_allowed_formats.help',
              'Every file is checked by its content. PDF is the only type on by default. The check of Word, Excel and OpenDocument files is best-effort: it refuses macros, embedded objects and the known ways of linking to outside content (including web links), but it does not detect every active-content mechanism these formats have. Turn them on only for customers you trust, and open such files with care. CSV files are passed on as they are: a formula in one runs when someone opens it in a spreadsheet.')}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {ALL_DOCUMENT_FORMATS.map((f) => {
              const current = normaliseFormats(values.customer_documents_allowed_formats);
              return (
                <label key={f} className="flex items-center gap-2 text-sm text-body">
                  <input
                    type="checkbox"
                    checked={current.includes(f)}
                    onChange={(e) => {
                      const next = e.target.checked ? [...current, f] : current.filter((x) => x !== f);
                      setVal('customer_documents_allowed_formats', normaliseFormats(next));
                    }}
                  />
                  <span>{f.toUpperCase()}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-3">
          <Input
            label={t('crmSettings.customer_documents_request_reminder_days.label', 'Remind about requested documents after (days, comma-separated; empty = off)') as string}
            value={values.customer_documents_request_reminder_days ?? '3,7'}
            onChange={(e) => setVal('customer_documents_request_reminder_days', e.target.value)} />
        </div>
      </Card>
      )}

      {showDashboardOverview && (
      /* Dashboard CRM overview — per-tile visibility. All settings
         default ON; the checkbox shows checked when the value is
         unset, matching the contracts card's pattern. The dashboard
         component reads these via /public/settings and hides the
         matching tile when the value is explicit false. */
      <Card>
        <h3 className="font-semibold text-heading mb-1">
          {t('crmSettings.section.dashboardOverview', 'Dashboard CRM overview')}
        </h3>
        <p className="text-xs text-neutral-500 mb-3">
          {t('crmSettings.section.dashboardOverviewHint',
            'Hide CRM overview tiles on the admin dashboard. All tiles render by default; uncheck to hide.')}
        </p>
        {checkboxDefaultOn('crm_overview_show_revenue', 'Revenue tiles (30 / 90 / 365 days)')}
        {checkboxDefaultOn('crm_overview_show_outstanding', 'Outstanding payments tile')}
        {checkboxDefaultOn('crm_overview_show_quotes', 'Quotes pipeline (per-status)')}
        {checkboxDefaultOn('crm_overview_show_invoices', 'Invoices pipeline (per-status)')}
      </Card>
      )}

      <SettingsSaveBar
        isDirty={isDirty}
        isSaving={saveAll.isPending}
        canSave={anySection}
        onSave={() => saveAll.mutate()}
        onDiscard={() => setValues(loaded)}
      />
    </div>
  );
};
