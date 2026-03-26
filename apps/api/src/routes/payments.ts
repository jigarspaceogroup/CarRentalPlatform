import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  initiatePaymentSchema,
  saveCardSchema,
  savedCardIdParamSchema,
} from '../validation/payment.schema';
import * as paymentController from '../controllers/payment.controller';

export const paymentRouter = Router();
export const savedCardRouter = Router();

// ---------------------------------------------------------------------------
// Payment routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /payments:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Initiate a payment
 *     description: >
 *       Create a payment for a booking. For card payments, provide either a
 *       savedCardId or a one-time cardToken. For COD, no card details are needed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - method
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               method:
 *                 type: string
 *                 enum: [CREDIT_CARD, DEBIT_CARD, CASH_ON_DELIVERY]
 *               savedCardId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of a previously saved card
 *               cardToken:
 *                 type: string
 *                 description: One-time token from the payment gateway for a new card
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error or payment failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Booking does not belong to user
 *       404:
 *         description: Booking or saved card not found
 *       409:
 *         description: Booking already has a completed payment
 */
paymentRouter.post(
  '/',
  requireAuth,
  validate(initiatePaymentSchema),
  asyncHandler(paymentController.initiatePayment),
);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Payment gateway webhook
 *     description: >
 *       Endpoint for the payment gateway to send asynchronous payment status
 *       updates. No authentication required (verified via webhook signature
 *       in production).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - status
 *             properties:
 *               transactionId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *     responses:
 *       200:
 *         description: Webhook received
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
 *                     received:
 *                       type: boolean
 *                       example: true
 */
paymentRouter.post('/webhook', asyncHandler(paymentController.handleWebhook));

// ---------------------------------------------------------------------------
// Saved card routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /saved-cards:
 *   get:
 *     tags:
 *       - Saved Cards
 *     summary: List saved cards
 *     description: Return all saved payment cards for the authenticated user. Gateway tokens are excluded.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved cards
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       lastFour:
 *                         type: string
 *                         example: "4242"
 *                       cardBrand:
 *                         type: string
 *                         example: Visa
 *                       expiryMonth:
 *                         type: integer
 *                       expiryYear:
 *                         type: integer
 *                       isDefault:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 */
savedCardRouter.get('/', requireAuth, asyncHandler(paymentController.listSavedCards));

/**
 * @openapi
 * /saved-cards:
 *   post:
 *     tags:
 *       - Saved Cards
 *     summary: Save a new card
 *     description: Save a payment card for future use. The first card saved becomes the default.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gatewayToken
 *               - lastFour
 *               - cardBrand
 *               - expiryMonth
 *               - expiryYear
 *             properties:
 *               gatewayToken:
 *                 type: string
 *               lastFour:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
 *                 example: "4242"
 *               cardBrand:
 *                 type: string
 *                 example: Visa
 *               expiryMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               expiryYear:
 *                 type: integer
 *                 minimum: 2024
 *     responses:
 *       201:
 *         description: Card saved
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
savedCardRouter.post(
  '/',
  requireAuth,
  validate(saveCardSchema),
  asyncHandler(paymentController.saveCard),
);

/**
 * @openapi
 * /saved-cards/{id}:
 *   delete:
 *     tags:
 *       - Saved Cards
 *     summary: Delete a saved card
 *     description: Remove a saved card. If it was the default, another card is automatically promoted.
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
 *         description: Card deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 */
savedCardRouter.delete(
  '/:id',
  requireAuth,
  validate(savedCardIdParamSchema, 'params'),
  asyncHandler(paymentController.deleteCard),
);

/**
 * @openapi
 * /saved-cards/{id}/default:
 *   put:
 *     tags:
 *       - Saved Cards
 *     summary: Set default card
 *     description: Set a saved card as the default payment method.
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
 *         description: Default card updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 */
savedCardRouter.put(
  '/:id/default',
  requireAuth,
  validate(savedCardIdParamSchema, 'params'),
  asyncHandler(paymentController.setDefaultCard),
);
