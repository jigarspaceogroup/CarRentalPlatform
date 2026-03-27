import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      aggregate: vi.fn(),
    },
  },
}));

vi.mock('../db/client', () => ({ prisma: mockPrisma }));

import * as customerService from './customer.service';

function makeCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cust-uuid-1',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+966500001234',
    profilePhotoUrl: null,
    status: 'ACTIVE',
    suspensionReason: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    deletedAt: null,
    ...overrides,
  };
}

describe('CustomerService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('listCustomers', () => {
    it('returns paginated customer list with booking stats', async () => {
      const customers = [{
        ...makeCustomer(),
        _count: { bookings: 5 },
        bookings: [{ totalAmount: '100.00' }, { totalAmount: '200.00' }],
      }];
      mockPrisma.user.findMany.mockResolvedValue(customers);
      mockPrisma.user.count.mockResolvedValue(1);
      const result = await customerService.listCustomers({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].bookingCount).toBe(5);
      expect(result.customers[0].totalSpent).toBe(300);
      expect(result.total).toBe(1);
    });

    it('applies search filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);
      await customerService.listCustomers({ page: 1, limit: 20, search: 'john', sortBy: 'createdAt', sortOrder: 'desc' });
      const call = mockPrisma.user.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toHaveLength(3);
    });

    it('returns empty list when no customers match', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);
      const result = await customerService.listCustomers({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
      expect(result.customers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getCustomerDetail', () => {
    it('returns customer with stats and recent bookings', async () => {
      const customer = {
        ...makeCustomer(), addresses: [],
        bookings: [{ id: 'b1', referenceNumber: 'BK-001', status: 'COMPLETED', totalAmount: '500.00',
          pickupDate: new Date(), dropoffDate: new Date(), createdAt: new Date(),
          vehicle: { id: 'v1', make: 'Toyota', model: 'Camry', year: 2024 } }],
      };
      mockPrisma.user.findFirst.mockResolvedValue(customer);
      mockPrisma.booking.aggregate.mockResolvedValue({ _count: { id: 3 }, _sum: { totalAmount: '1500.00' }, _max: { createdAt: new Date('2025-06-01') } });
      const result = await customerService.getCustomerDetail('cust-uuid-1');
      expect(result.id).toBe('cust-uuid-1');
      expect(result.stats.totalBookings).toBe(3);
      expect(result.stats.totalSpent).toBe(1500);
      expect(result.recentBookings).toHaveLength(1);
    });

    it('throws not found for non-existent customer', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(customerService.getCustomerDetail('nonexistent')).rejects.toThrow('Customer not found');
    });
  });
