import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Users, X } from 'lucide-react';

import { Button } from '../common';
import { customerAdminService } from '../../services/customerAdmin.service';

export interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: { id: number; name: string } | null;
  onDeleted?: (deletedId: number) => void;
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, deleting, onClose]);

  if (!isOpen || !client) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await customerAdminService.erase(client.id);
      toast.success(t('customers.deleteModal.success', 'Fiche client supprimée.'));
      await queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      onDeleted?.(client.id);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || t('common.error', 'Une erreur est survenue');
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-client-modal-title"
      onClick={() => !deleting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-panel shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('customers.modal.eyebrow', 'Action rapide')}
            </p>
            <h2 id="delete-client-modal-title" className="mt-1 text-xl font-bold text-heading">
              {t('customers.deleteModal.title', 'Supprimer cette fiche client ?')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-subtle text-soft hover:text-heading hover:bg-hover transition-colors"
            aria-label={t('common.close', 'Fermer')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-soft">
            {t('customers.deleteModal.descriptionPrefix', 'Vous êtes sur le point de supprimer')}{' '}
            <span className="font-semibold text-heading">{client.name}</span>{' '}
            {t(
              'customers.deleteModal.descriptionSuffix',
              'de votre répertoire clients. Cette action supprime uniquement la fiche client et ne supprime pas les projets ou contenus associés.',
            )}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 pb-6 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} isLoading={deleting}>
            {t('customers.deleteModal.confirm', 'Supprimer le client')}
          </Button>
        </div>
      </div>
    </div>
  );
};

