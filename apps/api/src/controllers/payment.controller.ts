import type { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { successResponse, paginationMeta } from '../utils/response';

// ---------------------------------------------------------------------------
// Customer endpoints
// ---------------------------------------------------------------------------

/**
 * POST /payments
 * Initiate a payment for a booking.
 */
export async function initiatePayment(req: Request, res: Response): Promise<void> {
  const payment = await paymentService.initiatePayment(req.user!.userId, req.body);
  res.status(201).json(successResponse(payment));
}

/**
 * POST /payments/webhook
 * Handle payment gateway webhook.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const result = await paymentService.handleWebhook(req.body);
  res.json(successResponse(result));
}

/**
 * GET /saved-cards
 * List saved cards for the authenticated user.
 */
export async function listSavedCards(req: Request, res: Response): Promise<void> {
  const cards = await paymentService.listSavedCards(req.user!.userId);
  res.json(successResponse(cards));
}

/**
 * POST /saved-cards
 * Save a new card.
 */
export async function saveCard(req: Request, res: Response): Promise<void> {
  const card = await paymentService.saveCard(req.user!.userId, req.body);
  res.status(201).json(successResponse(card));
}

/**
 * DELETE /saved-cards/:id
 * Delete a saved card.
 */
export async function deleteCard(req: Request, res: Response): Promise<void> {
  await paymentService.deleteCard(req.user!.userId, req.params.id as string);
  res.json(successResponse({ message: 'Card deleted successfully' }));
}

/**
 * PUT /saved-cards/:id/default
 * Set a saved card as default.
 */
export async function setDefaultCard(req: Request, res: Response): Promise<void> {
  await paymentService.setDefaultCard(req.user!.userId, req.params.id as string);
  res.json(successResponse({ message: 'Default card updated' }));
}

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

/**
 * GET /admin/payments
 * List all payments with filters and pagination.
 */
export async function adminListPayments(req: Request, res: Response): Promise<void> {
  const result = await paymentService.adminListPayments(req.query as any);
  res.json(
    successResponse(result.payments, paginationMeta(result.page, result.limit, result.total)),
  );
}

/**
 * GET /admin/payments/:id
 * Get full payment detail.
 */
export async function adminGetPayment(req: Request, res: Response): Promise<void> {
  const payment = await paymentService.adminGetPayment(req.params.id as string);
  res.json(successResponse(payment));
}

/**
 * POST /admin/payments/:id/refund
 * Process a refund for a payment.
 */
export async function processRefund(req: Request, res: Response): Promise<void> {
  const refund = await paymentService.processRefund(
    req.params.id as string,
    req.user!.userId,
    req.body,
  );
  res.status(201).json(successResponse(refund));
}

/**
 * PUT /admin/payments/:id/mark-paid
 * Mark a COD payment as paid.
 */
export async function markCodPaid(req: Request, res: Response): Promise<void> {
  const payment = await paymentService.markCodPaid(req.params.id as string, req.user!.userId);
  res.json(successResponse(payment));
}

/**
 * GET /admin/payments/summary
 * Get financial summary.
 */
export async function getFinancialSummary(req: Request, res: Response): Promise<void> {
  const summary = await paymentService.getFinancialSummary(req.query as any);
  res.json(successResponse(summary));
}

/**
 * GET /admin/payments/export
 * Export payments as CSV.
 */
export async function exportPayments(req: Request, res: Response): Promise<void> {
  const csv = await paymentService.exportPayments(req.query as any);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=payments-export.csv');
  res.send(csv);
}
