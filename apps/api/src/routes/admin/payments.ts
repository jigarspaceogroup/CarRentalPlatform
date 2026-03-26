import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff, requireRole } from '../../middleware/auth';
import type { StaffRole } from '@crp/shared';
import {
  adminListPaymentsQuerySchema,
  paymentIdParamSchema,
  processRefundSchema,
  financialSummaryQuerySchema,
  exportPaymentsQuerySchema,
} from '../../validation/payment.schema';
import * as paymentController from '../../controllers/payment.controller';

export const adminPaymentRouter = Router();

// All admin payment routes require staff authentication
adminPaymentRouter.use(requireAuth, requireStaff);

// ---------------------------------------------------------------------------
// Collection routes (before /:id to avoid route conflicts)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/payments/summary:
 *   get:
 *     tags:
 *       - Admin - Payments
 *     summary: Financial summary
 *     description: >
 *       Get aggregated financial data including total revenue, refunds,
 *       outstanding COD, and net revenue. Optionally filter by date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 50000.00
 *                     totalRefunds:
 *                       type: number
 *                       example: 2500.00
 *                     outstandingCod:
 *                       type: number
 *                       example: 3000.00
 *                     netRevenue:
 *                       type: number
 *                       example: 47500.00
 *                     paymentCount:
 *                       type: integer
 *                       example: 120
 *                     refundCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminPaymentRouter.get(
  '/summary',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(financialSummaryQuerySchema, 'query'),
  asyncHandler(paymentController.getFinancialSummary),
);

/**
 * @openapi
 * /admin/payments/export:
 *   get:
 *     tags:
 *       - Admin - Payments
 *     summary: Export payments as CSV
 *     description: Download a CSV file of payments. Optionally filter by method, status, and date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, CASH_ON_DELIVERY]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminPaymentRouter.get(
  '/export',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(exportPaymentsQuerySchema, 'query'),
  asyncHandler(paymentController.exportPayments),
);

/**
 * @openapi
 * /admin/payments:
 *   get:
 *     tags:
 *       - Admin - Payments
 *     summary: List all payments
 *     description: >
 *       List payments with optional filtering by method, status, date range,
 *       and search (booking ref, customer name/email). Paginated, sorted by
 *       most recent first.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, CASH_ON_DELIVERY]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by booking reference, customer name, or email
 *     responses:
 *       200:
 *         description: Paginated list of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminPaymentRouter.get(
  '/',
  validate(adminListPaymentsQuerySchema, 'query'),
  asyncHandler(paymentController.adminListPayments),
);

// ---------------------------------------------------------------------------
// Single payment routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/payments/{id}:
 *   get:
 *     tags:
 *       - Admin - Payments
 *     summary: Get payment detail
 *     description: Get full payment detail including booking info, customer, and refund history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment detail
 *       404:
 *         description: Payment not found
 */
adminPaymentRouter.get(
  '/:id',
  validate(paymentIdParamSchema, 'params'),
  asyncHandler(paymentController.adminGetPayment),
);

/**
 * @openapi
 * /admin/payments/{id}/refund:
 *   post:
 *     tags:
 *       - Admin - Payments
 *     summary: Process a refund
 *     description: >
 *       Refund part or all of a completed payment. The refund amount cannot
 *       exceed the remaining refundable balance.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 150.00
 *               reason:
 *                 type: string
 *                 example: Customer requested cancellation
 *     responses:
 *       201:
 *         description: Refund processed
 *       400:
 *         description: Validation error or refund amount exceeds balance
 *       404:
 *         description: Payment not found
 */
adminPaymentRouter.post(
  '/:id/refund',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(paymentIdParamSchema, 'params'),
  validate(processRefundSchema),
  asyncHandler(paymentController.processRefund),
);

/**
 * @openapi
 * /admin/payments/{id}/mark-paid:
 *   put:
 *     tags:
 *       - Admin - Payments
 *     summary: Mark COD payment as paid
 *     description: >
 *       Mark a Cash on Delivery payment as paid after cash has been collected
 *       from the customer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment marked as paid
 *       400:
 *         description: Payment is not COD or not in pending state
 *       404:
 *         description: Payment not found
 */
adminPaymentRouter.put(
  '/:id/mark-paid',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(paymentIdParamSchema, 'params'),
  asyncHandler(paymentController.markCodPaid),
);
