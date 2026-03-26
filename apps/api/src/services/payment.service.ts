import type { Payment, Refund, SavedCard, Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import {
  chargeCard,
  refundPayment as gatewayRefund,
  tokenizeCard,
} from '../utils/payment-gateway';
import type {
  InitiatePaymentInput,
  SaveCardInput,
  AdminListPaymentsQuery,
  ProcessRefundInput,
  FinancialSummaryQuery,
  ExportPaymentsQuery,
} from '../validation/payment.schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FinancialSummary {
  totalRevenue: number;
  totalRefunds: number;
  outstandingCod: number;
  netRevenue: number;
  paymentCount: number;
  refundCount: number;
}

// ---------------------------------------------------------------------------
// Customer payment operations
// ---------------------------------------------------------------------------

/**
 * Initiate a payment for a booking.
 */
export async function initiatePayment(
  userId: string,
  data: InitiatePaymentInput,
): Promise<Payment> {
  // 1. Find booking and verify ownership
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: { payments: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.userId !== userId) {
    throw AppError.forbidden('You do not own this booking');
  }

  // 2. Verify booking status
  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    throw AppError.badRequest('Booking is not in a payable state');
  }

  // 3. Check no existing completed payment
  const existingCompleted = booking.payments.find((p) => p.status === 'COMPLETED');
  if (existingCompleted) {
    throw AppError.conflict('This booking already has a completed payment');
  }

  const amount = Number(booking.totalAmount);

  // 4. Handle Cash on Delivery
  if (data.method === 'CASH_ON_DELIVERY') {
    const payment = await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        amount: booking.totalAmount,
        currency: 'SAR',
        method: 'CASH_ON_DELIVERY',
        status: 'PENDING',
      },
    });

    // Confirm booking if still pending
    if (booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' },
      });

      await prisma.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          changedByUserId: userId,
          note: 'Payment initiated (Cash on Delivery)',
        },
      });
    }

    return payment;
  }

  // 5. Handle card payments (CREDIT_CARD / DEBIT_CARD)
  let cardToken = data.cardToken ?? '';

  if (data.savedCardId) {
    const savedCard = await prisma.savedCard.findUnique({
      where: { id: data.savedCardId },
    });

    if (!savedCard || savedCard.userId !== userId) {
      throw AppError.notFound('Saved card not found');
    }

    cardToken = savedCard.gatewayToken;
  }

  // 6. Charge via gateway
  const chargeResult = await chargeCard(amount, 'SAR', cardToken);

  if (chargeResult.status !== 'success') {
    // Create a FAILED payment record
    await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        amount: booking.totalAmount,
        currency: 'SAR',
        method: data.method,
        status: 'FAILED',
        savedCardId: data.savedCardId ?? null,
        gatewayTransactionId: chargeResult.transactionId,
        gatewayResponse: { status: 'failed' } as unknown as Prisma.InputJsonValue,
      },
    });
    throw AppError.badRequest('Payment failed. Please try again.');
  }

  // 7. Create successful payment
  const payment = await prisma.payment.create({
    data: {
      bookingId: data.bookingId,
      amount: booking.totalAmount,
      currency: 'SAR',
      method: data.method,
      status: 'COMPLETED',
      savedCardId: data.savedCardId ?? null,
      gatewayTransactionId: chargeResult.transactionId,
      gatewayResponse: { status: 'success' } as unknown as Prisma.InputJsonValue,
      paidAt: new Date(),
    },
  });

  // 8. Update booking to CONFIRMED
  const previousStatus = booking.status;
  if (previousStatus === 'PENDING') {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED' },
    });
  }

  // 9. Create booking status history entry
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      fromStatus: previousStatus,
      toStatus: 'CONFIRMED',
      changedByUserId: userId,
      note: `Payment completed via ${data.method}`,
    },
  });

  return payment;
}

/**
 * Handle a webhook from the payment gateway.
 *
 * In production: verify the webhook signature, parse the event type, etc.
 * For dev mock: directly locate and update the payment.
 */
export async function handleWebhook(payload: {
  transactionId: string;
  status: 'success' | 'failed';
}): Promise<{ received: true }> {
  const payment = await prisma.payment.findFirst({
    where: { gatewayTransactionId: payload.transactionId },
    include: { booking: true },
  });

  if (!payment) {
    // Silently ignore unknown transactions (idempotent)
    return { received: true };
  }

  if (payload.status === 'success' && payment.status !== 'COMPLETED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        gatewayResponse: { webhookStatus: 'success' } as unknown as Prisma.InputJsonValue,
      },
    });

    if (payment.booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      await prisma.bookingStatusHistory.create({
        data: {
          bookingId: payment.bookingId,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          note: 'Payment confirmed via webhook',
        },
      });
    }
  } else if (payload.status === 'failed' && payment.status === 'PENDING') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        gatewayResponse: { webhookStatus: 'failed' } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return { received: true };
}

// ---------------------------------------------------------------------------
// Saved cards
// ---------------------------------------------------------------------------

/**
 * List saved cards for a user (excludes the raw gateway token).
 */
export async function listSavedCards(
  userId: string,
): Promise<Omit<SavedCard, 'gatewayToken'>[]> {
  const cards = await prisma.savedCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return cards.map(({ gatewayToken: _gt, ...rest }) => rest);
}

/**
 * Save a new card for the user.
 */
export async function saveCard(
  userId: string,
  data: SaveCardInput,
): Promise<Omit<SavedCard, 'gatewayToken'>> {
  // Tokenize through gateway (in production this would store the real token)
  const { gatewayToken } = await tokenizeCard(data.gatewayToken);

  // Check if this is the user's first card
  const existingCount = await prisma.savedCard.count({ where: { userId } });
  const isDefault = existingCount === 0;

  const card = await prisma.savedCard.create({
    data: {
      userId,
      gatewayToken,
      lastFour: data.lastFour,
      cardBrand: data.cardBrand,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      isDefault,
    },
  });

  const { gatewayToken: _gt, ...safe } = card;
  return safe;
}

/**
 * Delete a saved card. If it was the default, promote another card.
 */
export async function deleteCard(userId: string, cardId: string): Promise<void> {
  const card = await prisma.savedCard.findUnique({ where: { id: cardId } });

  if (!card || card.userId !== userId) {
    throw AppError.notFound('Saved card not found');
  }

  await prisma.savedCard.delete({ where: { id: cardId } });

  // If deleted card was default, promote the next card
  if (card.isDefault) {
    const nextCard = await prisma.savedCard.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (nextCard) {
      await prisma.savedCard.update({
        where: { id: nextCard.id },
        data: { isDefault: true },
      });
    }
  }
}

/**
 * Set a saved card as the default payment method.
 */
export async function setDefaultCard(userId: string, cardId: string): Promise<void> {
  const card = await prisma.savedCard.findUnique({ where: { id: cardId } });

  if (!card || card.userId !== userId) {
    throw AppError.notFound('Saved card not found');
  }

  // Unset current default
  await prisma.savedCard.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  // Set new default
  await prisma.savedCard.update({
    where: { id: cardId },
    data: { isDefault: true },
  });
}

// ---------------------------------------------------------------------------
// Admin payment operations
// ---------------------------------------------------------------------------

/**
 * List all payments with filters and pagination (admin).
 */
export async function adminListPayments(filters: AdminListPaymentsQuery) {
  const { page, limit, method, status, startDate, endDate, search } = filters;

  const where: Prisma.PaymentWhereInput = {};

  if (method) where.method = method;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
  }

  if (search) {
    where.booking = {
      OR: [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    };
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            referenceNumber: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
}

/**
 * Get full payment detail with booking, user, and refunds (admin).
 */
export async function adminGetPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          totalAmount: true,
          pickupDate: true,
          dropoffDate: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      refunds: {
        include: {
          processedByStaff: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  return payment;
}

/**
 * Process a refund for a completed payment (admin).
 */
export async function processRefund(
  paymentId: string,
  staffId: string,
  data: ProcessRefundInput,
): Promise<Refund> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { refunds: true },
  });

  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  if (payment.status !== 'COMPLETED' && payment.status !== 'PARTIALLY_REFUNDED') {
    throw AppError.badRequest('Only completed or partially refunded payments can be refunded');
  }

  // Calculate already refunded amount
  const alreadyRefunded = payment.refunds
    .filter((r) => r.status === 'PROCESSED')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const paymentAmount = Number(payment.amount);
  const remainingRefundable = paymentAmount - alreadyRefunded;

  if (data.amount > remainingRefundable) {
    throw AppError.badRequest(
      `Refund amount exceeds refundable balance. Maximum refundable: ${remainingRefundable.toFixed(2)}`,
    );
  }

  // Call gateway for non-COD payments
  let gatewayRefundId: string | null = null;
  if (payment.method !== 'CASH_ON_DELIVERY' && payment.gatewayTransactionId) {
    const refundResult = await gatewayRefund(payment.gatewayTransactionId, data.amount);
    if (refundResult.status !== 'success') {
      throw AppError.internal('Gateway refund failed. Please try again.');
    }
    gatewayRefundId = refundResult.refundId;
  }

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId,
      amount: data.amount,
      reason: data.reason,
      status: 'PROCESSED',
      gatewayRefundId,
      processedByStaffId: staffId,
      processedAt: new Date(),
    },
  });

  // Determine new payment status
  const totalRefundedAfter = alreadyRefunded + data.amount;
  const isFullRefund = Math.abs(totalRefundedAfter - paymentAmount) < 0.01;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    },
  });

  return refund;
}

/**
 * Mark a Cash-on-Delivery payment as paid (admin).
 */
export async function markCodPaid(paymentId: string, staffId: string): Promise<Payment> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });

  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  if (payment.method !== 'CASH_ON_DELIVERY') {
    throw AppError.badRequest('Only Cash on Delivery payments can be marked as paid');
  }

  if (payment.status !== 'PENDING') {
    throw AppError.badRequest('Payment is not in pending state');
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  });

  // Create status history entry
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: payment.bookingId,
      fromStatus: payment.booking.status,
      toStatus: payment.booking.status, // Status doesn't change, just noting payment
      changedByStaffId: staffId,
      note: 'Cash on Delivery payment collected',
    },
  });

  return updated;
}

/**
 * Get financial summary aggregations (admin).
 */
export async function getFinancialSummary(
  query: FinancialSummaryQuery,
): Promise<FinancialSummary> {
  const dateFilter: Prisma.PaymentWhereInput = {};
  if (query.startDate || query.endDate) {
    dateFilter.createdAt = {};
    if (query.startDate) (dateFilter.createdAt as Prisma.DateTimeFilter).gte = query.startDate;
    if (query.endDate) (dateFilter.createdAt as Prisma.DateTimeFilter).lte = query.endDate;
  }

  const refundDateFilter: Prisma.RefundWhereInput = {};
  if (query.startDate || query.endDate) {
    refundDateFilter.createdAt = {};
    if (query.startDate)
      (refundDateFilter.createdAt as Prisma.DateTimeFilter).gte = query.startDate;
    if (query.endDate)
      (refundDateFilter.createdAt as Prisma.DateTimeFilter).lte = query.endDate;
  }

  const [revenueAgg, refundAgg, outstandingCodAgg, paymentCount, refundCount] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { ...dateFilter, status: 'COMPLETED' },
      }),
      prisma.refund.aggregate({
        _sum: { amount: true },
        where: { ...refundDateFilter, status: 'PROCESSED' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...dateFilter,
          method: 'CASH_ON_DELIVERY',
          status: 'PENDING',
        },
      }),
      prisma.payment.count({
        where: { ...dateFilter, status: 'COMPLETED' },
      }),
      prisma.refund.count({
        where: { ...refundDateFilter, status: 'PROCESSED' },
      }),
    ]);

  const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
  const totalRefunds = Number(refundAgg._sum.amount ?? 0);
  const outstandingCod = Number(outstandingCodAgg._sum.amount ?? 0);

  return {
    totalRevenue,
    totalRefunds,
    outstandingCod,
    netRevenue: totalRevenue - totalRefunds,
    paymentCount,
    refundCount,
  };
}

/**
 * Export payments as a CSV string (admin).
 */
export async function exportPayments(filters: ExportPaymentsQuery): Promise<string> {
  const where: Prisma.PaymentWhereInput = {};

  if (filters.method) where.method = filters.method;
  if (filters.status) where.status = filters.status;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      booking: {
        select: {
          referenceNumber: true,
          user: {
            select: { fullName: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Build CSV
  const header = 'Booking Ref,Amount,Currency,Method,Status,Date,Customer,Email';
  const rows = payments.map((p) => {
    const date = p.paidAt ? p.paidAt.toISOString() : p.createdAt.toISOString();
    const customerName = p.booking.user.fullName ?? '';
    const customerEmail = p.booking.user.email ?? '';
    // Escape fields that might contain commas
    const escapeCsv = (val: string) =>
      val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;

    return [
      p.booking.referenceNumber,
      Number(p.amount).toFixed(2),
      p.currency,
      p.method,
      p.status,
      date,
      escapeCsv(customerName),
      escapeCsv(customerEmail),
    ].join(',');
  });

  return [header, ...rows].join('\n');
}
