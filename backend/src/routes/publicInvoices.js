const express = require('express');
const { db } = require('../database/db');
const { handleAsync, successResponse } = require('../utils/routeHelpers');

const router = express.Router();

/**
 * GET /api/public/invoices/:token
 * Public client-facing invoice view identified by public_token or invoice_number.
 */
router.get(
  '/:token',
  handleAsync(async (req, res) => {
    const token = String(req.params.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Token de facture manquant.' });
    }

    const cols = await db('invoices').columnInfo();
    let invoice = null;
    if ('public_token' in cols) {
      invoice = await db('invoices').where({ public_token: token }).first();
    }
    if (!invoice) {
      invoice = await db('invoices').where({ invoice_number: token }).first();
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }

    const [items, studio] = await Promise.all([
      db('invoice_items').where({ invoice_id: invoice.id }).orderBy('id', 'asc').catch(() => []),
      invoice.studio_id
        ? db('studios')
            .where({ id: invoice.studio_id })
            .first('id', 'name', 'slug', 'business_email', 'phone', 'website', 'city', 'country', 'logo_url')
        : null,
    ]);

    return successResponse(res, {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        currency: invoice.currency || 'EUR',
        subtotalMinor: invoice.subtotal_minor ?? 0,
        taxMinor: invoice.tax_minor ?? 0,
        totalMinor: invoice.total_minor ?? 0,
        paidAmountMinor: invoice.paid_amount_minor ?? 0,
        issuedAt: invoice.issued_at || invoice.created_at,
        dueAt: invoice.due_at || null,
        paidAt: invoice.paid_at || null,
        notes: invoice.notes || null,
      },
      items,
      studio: studio || null,
    });
  })
);

module.exports = router;

