/**
 * Admin → customer record → Activity (#1444).
 *
 * The customer's timeline — document uploads, shares, views, reviews and
 * deletions, plus account and group changes — newest first, from the
 * activity log. Labels come from admin.activities.<type>, the same keys the
 * dashboard's recent activity uses; an unknown type still renders, as its
 * key made readable.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';

import { Button, Card, Loading } from '../common';
import { useLocalizedDate } from '../../hooks/useLocalizedDate';
import { customerAdminService, type CustomerActivityEntry } from '../../services/customerAdmin.service';

const readable = (type: string) => type.replace(/^customer_/, '').replace(/_/g, ' ');

export const CustomerActivityCard: React.FC<{ customerId: number }> = ({ customerId }) => {
  const { t } = useTranslation();
  const { formatDateTime } = useLocalizedDate();
  const {
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-customer-activity', customerId],
    queryFn: ({ pageParam }) => customerAdminService.activity(customerId, pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.nextBeforeId,
  });

  const entries: CustomerActivityEntry[] = data?.pages.flatMap((p) => p.entries) ?? [];

  const label = (e: CustomerActivityEntry) => {
    // The shared labels name the customer ("Customer logged in: {{email}}").
    // On the customer's own record that is redundant, and the address is not
    // sent: drop the empty tail.
    const text = (t(`admin.activities.${e.type}`, {
      defaultValue: readable(e.type),
      ...e.metadata,
      email: '',
    }) as string).replace(/[\s:]+$/, '');
    return e.metadata.documentId ? `${text} (#${e.metadata.documentId})` : text;
  };

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-heading mb-1 flex items-center gap-2">
        <History className="w-5 h-5" />
        {t('customers.activity.title', 'Activity')}
      </h2>
      <p className="text-xs text-muted mb-4">
        {t('customers.activity.hint', 'What happened on this customer\'s account and documents, newest first.')}
      </p>
      {isLoading ? <Loading /> : isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t('customers.activity.loadError', 'Could not load the activity.')}
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">
          {t('customers.activity.empty', 'No activity yet.')}
        </p>
      ) : (
        <>
          <ol className="relative space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-line">
            {entries.map((e) => (
              <li key={e.id} className="relative flex items-start gap-3.5 pl-0">
                <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-soft">
                  <History className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-heading break-words">{label(e)}</p>
                  <p className="mt-0.5 text-xs text-soft">
                    {e.actorType === 'customer'
                      ? t('customers.activity.byCustomer', 'Par le client')
                      : e.actorType === 'admin'
                        ? t('customers.activity.byAdmin', 'Par {{name}}', { name: e.actorName || t('customers.documents.anAdmin', 'un administrateur') })
                        : t('customers.activity.bySystem', 'Automatique')}
                  </p>
                  {e.at && (
                    <time dateTime={e.at} className="mt-1 block text-[11px] text-muted">
                      {formatDateTime(e.at)}
                    </time>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {hasNextPage && (
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => fetchNextPage()} isLoading={isFetchingNextPage}>
                {t('customers.activity.more', 'Show older')}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default CustomerActivityCard;
