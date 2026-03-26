import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock objects
// ---------------------------------------------------------------------------

const { mockPrisma, mockGateway } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    savedCard: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    refund: {
      create: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    bookingStatusHistory: {
      create: vi.fn(),
    },
  },
  mockGateway: {
    chargeCard: vi.fn(),
    refundPayment: vi.fn(),
    tokenizeCard: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../db/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('../utils/payment-gateway', () => ({
  chargeCard: mockGateway.chargeCard,
  refundPayment: mockGateway.refundPayment,
  tokenizeCard: mockGateway.tokenizeCard,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import * as paymentService from './payment.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-uuid-1',
    referenceNumber: 'BK-2026-ABC123',
    userId: 'user-uuid-1',
    vehicleId: 'vehicle-uuid-1',
    status: 'PENDING',
    totalAmount: 500.0,
    payments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment-uuid-1',
    bookingId: 'booking-uuid-1',
    amount: 500.0,
    currency: 'SAR',
    method: 'CREDIT_CARD',
    status: 'COMPLETED',
    gatewayTransactionId: 'txn_12345',
    gatewayResponse: { status: 'success' },
    savedCardId: null,
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSavedCard(overrides: Record<string, unknown> = {}) {
  return {
    id: 'card-uuid-1',
    userId: 'user-uuid-1',
    gatewayToken: 'tok_abc123',
    lastFour: '4242',
    cardBrand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2028,
    isDefault: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeRefund(overrides: Record<string, unknown> = {}) {
  return {
    id: 'refund-uuid-1',
    paymentId: 'payment-uuid-1',
    amount: 100.0,
    reason: 'Customer request',
    status: 'PROCESSED',
    gatewayRefundId: 'ref_12345',
    processedByStaffId: 'staff-uuid-1',
    processedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── initiatePayment ──────────────────────────────────────────────────

  describe('initiatePayment', () => {
    it('creates a card payment successfully', async () => {
      const booking = makeBooking();
      const payment = makePayment();

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockGateway.chargeCard.mockResolvedValue({
        transactionId: 'txn_12345',
        status: 'success',
      });
      mockPrisma.payment.create.mockResolvedValue(payment);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'CONFIRMED' });
      mockPrisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await paymentService.initiatePayment('user-uuid-1', {
        bookingId: 'booking-uuid-1',
        method: 'CREDIT_CARD',
        cardToken: 'tok_test_123',
      });

      expect(result.id).toBe('payment-uuid-1');
      expect(mockGateway.chargeCard).toHaveBeenCalledWith(500, 'SAR', 'tok_test_123');
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            method: 'CREDIT_CARD',
          }),
        }),
      );
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'CONFIRMED' },
        }),
      );
      expect(mockPrisma.bookingStatusHistory.create).toHaveBeenCalledOnce();
    });

    it('creates a COD payment successfully', async () => {
      const booking = makeBooking();
      const payment = makePayment({ method: 'CASH_ON_DELIVERY', status: 'PENDING', paidAt: null });

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.payment.create.mockResolvedValue(payment);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'CONFIRMED' });
      mockPrisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await paymentService.initiatePayment('user-uuid-1', {
        bookingId: 'booking-uuid-1',
        method: 'CASH_ON_DELIVERY',
      });

      expect(result.method).toBe('CASH_ON_DELIVERY');
      expect(mockGateway.chargeCard).not.toHaveBeenCalled();
      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            method: 'CASH_ON_DELIVERY',
          }),
        }),
      );
    });

    it('throws not found when booking does not exist', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.initiatePayment('user-uuid-1', {
          bookingId: 'nonexistent',
          method: 'CREDIT_CARD',
          cardToken: 'tok_test',
        }),
      ).rejects.toThrow('Booking not found');
    });

    it('throws forbidden when booking belongs to another user', async () => {
      const booking = makeBooking({ userId: 'other-user-uuid' });
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        paymentService.initiatePayment('user-uuid-1', {
          bookingId: 'booking-uuid-1',
          method: 'CREDIT_CARD',
          cardToken: 'tok_test',
        }),
      ).rejects.toThrow('You do not own this booking');
    });

    it('throws conflict when booking already has a completed payment', async () => {
      const booking = makeBooking({
        payments: [makePayment({ status: 'COMPLETED' })],
      });
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        paymentService.initiatePayment('user-uuid-1', {
          bookingId: 'booking-uuid-1',
          method: 'CREDIT_CARD',
          cardToken: 'tok_test',
        }),
      ).rejects.toThrow('This booking already has a completed payment');
    });

    it('throws bad request when booking is not in a payable state', async () => {
      const booking = makeBooking({ status: 'CANCELLED', payments: [] });
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      await expect(
        paymentService.initiatePayment('user-uuid-1', {
          bookingId: 'booking-uuid-1',
          method: 'CREDIT_CARD',
          cardToken: 'tok_test',
        }),
      ).rejects.toThrow('Booking is not in a payable state');
    });

    it('uses saved card gateway token when savedCardId is provided', async () => {
      const booking = makeBooking();
      const card = makeSavedCard();
      const payment = makePayment();

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.savedCard.findUnique.mockResolvedValue(card);
      mockGateway.chargeCard.mockResolvedValue({
        transactionId: 'txn_12345',
        status: 'success',
      });
      mockPrisma.payment.create.mockResolvedValue(payment);
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'CONFIRMED' });
      mockPrisma.bookingStatusHistory.create.mockResolvedValue({});

      await paymentService.initiatePayment('user-uuid-1', {
        bookingId: 'booking-uuid-1',
        method: 'CREDIT_CARD',
        savedCardId: 'card-uuid-1',
      });

      expect(mockGateway.chargeCard).toHaveBeenCalledWith(500, 'SAR', 'tok_abc123');
    });

    it('throws not found when saved card belongs to another user', async () => {
      const booking = makeBooking();
      const card = makeSavedCard({ userId: 'other-user-uuid' });

      mockPrisma.booking.findUnique.mockResolvedValue(booking);
      mockPrisma.savedCard.findUnique.mockResolvedValue(card);

      await expect(
        paymentService.initiatePayment('user-uuid-1', {
          bookingId: 'booking-uuid-1',
          method: 'CREDIT_CARD',
          savedCardId: 'card-uuid-1',
        }),
      ).rejects.toThrow('Saved card not found');
    });
  });

  // ── listSavedCards ──────────────────────────────────────────────────

  describe('listSavedCards', () => {
    it('returns cards without the gatewayToken field', async () => {
      const cards = [makeSavedCard(), makeSavedCard({ id: 'card-uuid-2', isDefault: false })];
      mockPrisma.savedCard.findMany.mockResolvedValue(cards);

      const result = await paymentService.listSavedCards('user-uuid-1');

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('gatewayToken');
      expect(result[1]).not.toHaveProperty('gatewayToken');
      expect(result[0]).toHaveProperty('lastFour', '4242');
    });

    it('returns empty array when user has no cards', async () => {
      mockPrisma.savedCard.findMany.mockResolvedValue([]);

      const result = await paymentService.listSavedCards('user-uuid-1');

      expect(result).toHaveLength(0);
    });
  });

  // ── saveCard ────────────────────────────────────────────────────────

  describe('saveCard', () => {
    it('saves a card and sets it as default when first card', async () => {
      mockGateway.tokenizeCard.mockResolvedValue({ gatewayToken: 'tok_new_123' });
      mockPrisma.savedCard.count.mockResolvedValue(0);
      const createdCard = makeSavedCard({ gatewayToken: 'tok_new_123', isDefault: true });
      mockPrisma.savedCard.create.mockResolvedValue(createdCard);

      const result = await paymentService.saveCard('user-uuid-1', {
        gatewayToken: 'raw_token',
        lastFour: '4242',
        cardBrand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2028,
      });

      expect(result).not.toHaveProperty('gatewayToken');
      expect(result.lastFour).toBe('4242');
      expect(mockPrisma.savedCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDefault: true,
            gatewayToken: 'tok_new_123',
          }),
        }),
      );
    });

    it('saves a card without default when user has existing cards', async () => {
      mockGateway.tokenizeCard.mockResolvedValue({ gatewayToken: 'tok_new_456' });
      mockPrisma.savedCard.count.mockResolvedValue(2);
      const createdCard = makeSavedCard({
        gatewayToken: 'tok_new_456',
        isDefault: false,
        id: 'card-uuid-2',
      });
      mockPrisma.savedCard.create.mockResolvedValue(createdCard);

      const result = await paymentService.saveCard('user-uuid-1', {
        gatewayToken: 'raw_token',
        lastFour: '1234',
        cardBrand: 'MasterCard',
        expiryMonth: 6,
        expiryYear: 2027,
      });

      expect(mockPrisma.savedCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDefault: false }),
        }),
      );
    });
  });

  // ── deleteCard ──────────────────────────────────────────────────────

  describe('deleteCard', () => {
    it('deletes a card and promotes next card if default', async () => {
      const card = makeSavedCard({ isDefault: true });
      const nextCard = makeSavedCard({ id: 'card-uuid-2', isDefault: false });

      mockPrisma.savedCard.findUnique.mockResolvedValue(card);
      mockPrisma.savedCard.delete.mockResolvedValue(card);
      mockPrisma.savedCard.findFirst.mockResolvedValue(nextCard);
      mockPrisma.savedCard.update.mockResolvedValue({ ...nextCard, isDefault: true });

      await paymentService.deleteCard('user-uuid-1', 'card-uuid-1');

      expect(mockPrisma.savedCard.delete).toHaveBeenCalledWith({
        where: { id: 'card-uuid-1' },
      });
      expect(mockPrisma.savedCard.update).toHaveBeenCalledWith({
        where: { id: 'card-uuid-2' },
        data: { isDefault: true },
      });
    });

    it('throws not found when card does not belong to user', async () => {
      const card = makeSavedCard({ userId: 'other-user-uuid' });
      mockPrisma.savedCard.findUnique.mockResolvedValue(card);

      await expect(
        paymentService.deleteCard('user-uuid-1', 'card-uuid-1'),
      ).rejects.toThrow('Saved card not found');
    });

    it('throws not found when card does not exist', async () => {
      mockPrisma.savedCard.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.deleteCard('user-uuid-1', 'nonexistent'),
      ).rejects.toThrow('Saved card not found');
    });
  });

  // ── setDefaultCard ──────────────────────────────────────────────────

  describe('setDefaultCard', () => {
    it('unsets current default and sets the new one', async () => {
      const card = makeSavedCard({ isDefault: false });
      mockPrisma.savedCard.findUnique.mockResolvedValue(card);
      mockPrisma.savedCard.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.savedCard.update.mockResolvedValue({ ...card, isDefault: true });

      await paymentService.setDefaultCard('user-uuid-1', 'card-uuid-1');

      expect(mockPrisma.savedCard.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrisma.savedCard.update).toHaveBeenCalledWith({
        where: { id: 'card-uuid-1' },
        data: { isDefault: true },
      });
    });

    it('throws not found when card does not belong to user', async () => {
      mockPrisma.savedCard.findUnique.mockResolvedValue(
        makeSavedCard({ userId: 'other-user-uuid' }),
      );

      await expect(
        paymentService.setDefaultCard('user-uuid-1', 'card-uuid-1'),
      ).rejects.toThrow('Saved card not found');
    });
  });

  // ── processRefund ────────────────────────────────────────────────────

  describe('processRefund', () => {
    it('processes a full refund successfully', async () => {
      const payment = makePayment({ refunds: [] });
      const refund = makeRefund({ amount: 500.0 });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockGateway.refundPayment.mockResolvedValue({
        refundId: 'ref_12345',
        status: 'success',
      });
      mockPrisma.refund.create.mockResolvedValue(refund);
      mockPrisma.payment.update.mockResolvedValue({ ...payment, status: 'REFUNDED' });

      const result = await paymentService.processRefund('payment-uuid-1', 'staff-uuid-1', {
        amount: 500.0,
        reason: 'Customer cancelled',
      });

      expect(result.id).toBe('refund-uuid-1');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'REFUNDED' },
        }),
      );
    });

    it('processes a partial refund successfully', async () => {
      const payment = makePayment({ refunds: [] });
      const refund = makeRefund({ amount: 200.0 });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockGateway.refundPayment.mockResolvedValue({
        refundId: 'ref_67890',
        status: 'success',
      });
      mockPrisma.refund.create.mockResolvedValue(refund);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: 'PARTIALLY_REFUNDED',
      });

      const result = await paymentService.processRefund('payment-uuid-1', 'staff-uuid-1', {
        amount: 200.0,
        reason: 'Partial service not provided',
      });

      expect(result.id).toBe('refund-uuid-1');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PARTIALLY_REFUNDED' },
        }),
      );
    });

    it('throws bad request when refund amount exceeds refundable balance', async () => {
      const payment = makePayment({
        amount: 500.0,
        refunds: [makeRefund({ amount: 400.0, status: 'PROCESSED' })],
      });
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        paymentService.processRefund('payment-uuid-1', 'staff-uuid-1', {
          amount: 200.0,
          reason: 'Too much',
        }),
      ).rejects.toThrow('Refund amount exceeds refundable balance');
    });

    it('throws not found when payment does not exist', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.processRefund('nonexistent', 'staff-uuid-1', {
          amount: 100.0,
          reason: 'Test',
        }),
      ).rejects.toThrow('Payment not found');
    });

    it('throws bad request when payment status is not refundable', async () => {
      const payment = makePayment({ status: 'PENDING', refunds: [] });
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        paymentService.processRefund('payment-uuid-1', 'staff-uuid-1', {
          amount: 100.0,
          reason: 'Test',
        }),
      ).rejects.toThrow('Only completed or partially refunded payments can be refunded');
    });
  });

  // ── markCodPaid ──────────────────────────────────────────────────────

  describe('markCodPaid', () => {
    it('marks a COD payment as paid', async () => {
      const payment = makePayment({
        method: 'CASH_ON_DELIVERY',
        status: 'PENDING',
        paidAt: null,
        booking: makeBooking({ status: 'CONFIRMED' }),
      });
      const updated = { ...payment, status: 'COMPLETED', paidAt: new Date() };

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue(updated);
      mockPrisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await paymentService.markCodPaid('payment-uuid-1', 'staff-uuid-1');

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            paidAt: expect.any(Date),
          }),
        }),
      );
    });

    it('throws bad request when payment is not COD', async () => {
      const payment = makePayment({
        method: 'CREDIT_CARD',
        status: 'PENDING',
        booking: makeBooking(),
      });
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        paymentService.markCodPaid('payment-uuid-1', 'staff-uuid-1'),
      ).rejects.toThrow('Only Cash on Delivery payments can be marked as paid');
    });

    it('throws bad request when COD payment is not pending', async () => {
      const payment = makePayment({
        method: 'CASH_ON_DELIVERY',
        status: 'COMPLETED',
        booking: makeBooking(),
      });
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        paymentService.markCodPaid('payment-uuid-1', 'staff-uuid-1'),
      ).rejects.toThrow('Payment is not in pending state');
    });

    it('throws not found when payment does not exist', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.markCodPaid('nonexistent', 'staff-uuid-1'),
      ).rejects.toThrow('Payment not found');
    });
  });

  // ── getFinancialSummary ──────────────────────────────────────────────

  describe('getFinancialSummary', () => {
    it('returns aggregated financial data', async () => {
      mockPrisma.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000 } }) // revenue
        .mockResolvedValueOnce({ _sum: { amount: 3000 } }); // outstanding COD
      mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 2500 } });
      mockPrisma.payment.count.mockResolvedValue(120);
      mockPrisma.refund.count.mockResolvedValue(5);

      const result = await paymentService.getFinancialSummary({});

      expect(result.totalRevenue).toBe(50000);
      expect(result.totalRefunds).toBe(2500);
      expect(result.outstandingCod).toBe(3000);
      expect(result.netRevenue).toBe(47500);
      expect(result.paymentCount).toBe(120);
      expect(result.refundCount).toBe(5);
    });

    it('returns zeros when no payments exist', async () => {
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
      mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: null } });
      mockPrisma.payment.count.mockResolvedValue(0);
      mockPrisma.refund.count.mockResolvedValue(0);

      const result = await paymentService.getFinancialSummary({});

      expect(result.totalRevenue).toBe(0);
      expect(result.totalRefunds).toBe(0);
      expect(result.outstandingCod).toBe(0);
      expect(result.netRevenue).toBe(0);
    });
  });

  // ── adminListPayments ────────────────────────────────────────────────

  describe('adminListPayments', () => {
    it('returns paginated payments', async () => {
      const payments = [makePayment()];
      mockPrisma.payment.findMany.mockResolvedValue(payments);
      mockPrisma.payment.count.mockResolvedValue(1);

      const result = await paymentService.adminListPayments({
        page: 1,
        limit: 20,
      });

      expect(result.payments).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('applies method and status filters', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.payment.count.mockResolvedValue(0);

      await paymentService.adminListPayments({
        page: 1,
        limit: 20,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
      });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            method: 'CREDIT_CARD',
            status: 'COMPLETED',
          }),
        }),
      );
    });
  });

  // ── adminGetPayment ──────────────────────────────────────────────────

  describe('adminGetPayment', () => {
    it('returns payment detail when found', async () => {
      const payment = makePayment({ refunds: [], booking: makeBooking() });
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      const result = await paymentService.adminGetPayment('payment-uuid-1');

      expect(result.id).toBe('payment-uuid-1');
    });

    it('throws not found when payment does not exist', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(paymentService.adminGetPayment('nonexistent')).rejects.toThrow(
        'Payment not found',
      );
    });
  });

  // ── handleWebhook ────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('updates payment on success webhook', async () => {
      const payment = makePayment({
        status: 'PENDING',
        booking: makeBooking({ status: 'PENDING' }),
      });

      mockPrisma.payment.findFirst.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({ ...payment, status: 'COMPLETED' });
      mockPrisma.booking.update.mockResolvedValue({});
      mockPrisma.bookingStatusHistory.create.mockResolvedValue({});

      const result = await paymentService.handleWebhook({
        transactionId: 'txn_12345',
        status: 'success',
      });

      expect(result.received).toBe(true);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('returns received true for unknown transaction (idempotent)', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      const result = await paymentService.handleWebhook({
        transactionId: 'txn_unknown',
        status: 'success',
      });

      expect(result.received).toBe(true);
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });
  });

  // ── exportPayments ──────────────────────────────────────────────────

  describe('exportPayments', () => {
    it('returns a CSV string with header and data rows', async () => {
      const payments = [
        {
          ...makePayment(),
          booking: {
            referenceNumber: 'BK-2026-ABC123',
            user: { fullName: 'John Doe', email: 'john@example.com' },
          },
        },
      ];
      mockPrisma.payment.findMany.mockResolvedValue(payments);

      const csv = await paymentService.exportPayments({});

      expect(csv).toContain('Booking Ref,Amount,Currency,Method,Status,Date,Customer,Email');
      expect(csv).toContain('BK-2026-ABC123');
      expect(csv).toContain('500.00');
      expect(csv).toContain('CREDIT_CARD');
      expect(csv).toContain('John Doe');
    });
  });
});
