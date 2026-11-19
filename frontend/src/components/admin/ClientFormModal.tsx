import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

import { Button, Input } from '../common';
import {
  customerAdminService,
  type CustomerAccountDetail,
  type CustomerAccountSummary,
} from '../../services/customerAdmin.service';

export interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When provided, the modal edits this client instead of creating a new one. */
  client?: Partial<CustomerAccountDetail> & Pick<CustomerAccountSummary, 'id' | 'email'> | null;
  onSuccess?: (saved: CustomerAccountDetail) => void;
}

function splitFullName(fullName: string): { firstName: string; lastName: string; displayName: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName, displayName: trimmed };
}

function resolveInitialName(client?: ClientFormModalProps['client']): string {
  if (!client) return '';
  if (client.displayName?.trim()) return client.displayName.trim();
  const joined = [client.firstName, client.lastName].filter(Boolean).join(' ').trim();
  return joined || '';
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(client?.id);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFullName(resolveInitialName(client));
    setEmail(client?.email || '');
    setPhone(client?.phone || '');
    setAddress(client?.addressLine1 || '');
    setNotes(client?.notes || '');
  }, [isOpen, client]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    if (!cleanName || !cleanEmail) {
      toast.error(t('customers.modal.requiredFields', 'Veuillez renseigner le nom complet et l’adresse e-mail.'));
      return;
    }

    const { firstName, lastName, displayName } = splitFullName(cleanName);
    setSubmitting(true);
    try {
      let saved: CustomerAccountDetail;
      if (isEditing && client?.id) {
        saved = await customerAdminService.update(client.id, {
          email: cleanEmail,
          displayName,
          firstName,
          lastName,
          phone: phone.trim() || null,
          addressLine1: address.trim() || null,
          notes: notes.trim() || null,
        });
        toast.success(t('customers.modal.updatedSuccess', 'Client mis à jour avec succès.'));
      } else {
        saved = await customerAdminService.createDirect(cleanEmail, {
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim() || undefined,
          address_line1: address.trim() || undefined,
        });
        if (notes.trim()) {
          saved = await customerAdminService.update(saved.id, { notes: notes.trim() });
        }
        toast.success(t('customers.modal.createdSuccess', 'Nouveau client ajouté avec succès.'));
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      if (saved?.id) {
        await queryClient.invalidateQueries({ queryKey: ['admin-customer', saved.id] });
      }
      onSuccess?.(saved);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t('common.error', 'Une erreur est survenue');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-form-modal-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-panel shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-line/60">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('customers.modal.eyebrow', 'Action rapide')}
            </p>
            <h2 id="client-form-modal-title" className="mt-1 text-xl font-bold text-heading">
              {isEditing
                ? t('customers.modal.editTitle', 'Modifier le client')
                : t('customers.modal.addTitle', 'Ajouter un client')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft hover:text-heading hover:bg-hover transition-colors"
            aria-label={t('common.close', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('customers.modal.fullName', 'Nom complet')}
              placeholder={t('customers.modal.fullNamePlaceholder', 'ex. Camille Laurent')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label={t('customers.modal.email', 'Adresse e-mail')}
              type="email"
              placeholder="client@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label={t('customers.modal.phone', 'Numéro de téléphone')}
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label={t('customers.modal.address', 'Adresse')}
              placeholder={t('customers.modal.addressPlaceholder', 'Rue, ville, code postal')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="client-notes-input" className="text-sm font-medium text-heading">
                {t('customers.modal.notes', 'Notes additionnelles')}
              </label>
              <span className="text-xs text-muted">{t('common.optional', 'Optionnel')}</span>
            </div>
            <textarea
              id="client-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('customers.modal.notesPlaceholder', 'Préférences ou informations utiles sur le client...')}
              className="w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {isEditing
                ? t('customers.modal.saveChanges', 'Enregistrer')
                : t('customers.modal.saveClient', 'Enregistrer le client')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

