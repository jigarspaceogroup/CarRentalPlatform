import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock objects
// ---------------------------------------------------------------------------

const { mockPrisma, mockSendPush } = vi.hoisted(() => ({
  mockPrisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
  mockSendPush: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../db/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('../utils/push-notification', () => ({
  sendPushNotification: mockSendPush,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import * as notificationService from './notification.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-uuid-1',
    userId: 'user-uuid-1',
    type: 'BOOKING_CONFIRMATION',
    titleEn: 'Booking Confirmed',
    titleAr: 'تم تأكيد الحجز',
    bodyEn: 'Your booking BK-20260101-ABCD has been confirmed.',
    bodyAr: 'تم تأكيد حجزك BK-20260101-ABCD بنجاح.',
    deepLink: 'booking://booking-uuid-1',
    metadata: { bookingRef: 'BK-20260101-ABCD', bookingId: 'booking-uuid-1' },
    isRead: false,
    sentAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

function makePreferences(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pref-uuid-1',
    userId: 'user-uuid-1',
    bookingUpdates: true,
    promotional: true,
    reminders: true,
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createNotification ──────────────────────────────────────────────

  describe('createNotification', () => {
    it('stores notification in DB and fires push', async () => {
      const notification = makeNotification();
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await notificationService.createNotification({
        userId: 'user-uuid-1',
        type: 'BOOKING_CONFIRMATION',
        titleEn: 'Booking Confirmed',
        titleAr: 'تم تأكيد الحجز',
        bodyEn: 'Your booking has been confirmed.',
        bodyAr: 'تم تأكيد حجزك.',
        deepLink: 'booking://booking-uuid-1',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('notif-uuid-1');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            type: 'BOOKING_CONFIRMATION',
          }),
        }),
      );
      expect(mockSendPush).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          title: 'Booking Confirmed',
        }),
      );
    });
  });

  // ── listNotifications ──────────────────────────────────────────────

  describe('listNotifications', () => {
    it('returns paginated results', async () => {
      const notifications = [makeNotification()];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await notificationService.listNotifications('user-uuid-1', 1, 20);

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1' },
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('calculates correct skip for page 2', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await notificationService.listNotifications('user-uuid-1', 2, 10);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  // ── getUnreadCount ──────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns correct unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await notificationService.getUnreadCount('user-uuid-1');

      expect(result.count).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRead: false },
      });
    });
  });

  // ── markAsRead ──────────────────────────────────────────────

  describe('markAsRead', () => {
    it('sets isRead to true', async () => {
      const notification = makeNotification();
      mockPrisma.notification.findFirst.mockResolvedValue(notification);
      mockPrisma.notification.update.mockResolvedValue({ ...notification, isRead: true });

      const result = await notificationService.markAsRead('notif-uuid-1', 'user-uuid-1');

      expect(result.isRead).toBe(true);
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-uuid-1', userId: 'user-uuid-1' },
      });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-uuid-1' },
        data: { isRead: true },
      });
    });

    it('throws not found when notification does not exist', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        notificationService.markAsRead('nonexistent', 'user-uuid-1'),
      ).rejects.toThrow('Notification not found');
    });

    it('throws not found when userId does not match', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        notificationService.markAsRead('notif-uuid-1', 'other-user'),
      ).rejects.toThrow('Notification not found');
    });
  });

  // ── markAllAsRead ──────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('updates all unread notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await notificationService.markAllAsRead('user-uuid-1');

      expect(result.updatedCount).toBe(3);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRead: false },
        data: { isRead: true },
      });
    });

    it('returns 0 when no unread notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await notificationService.markAllAsRead('user-uuid-1');

      expect(result.updatedCount).toBe(0);
    });
  });

  // ── getPreferences ──────────────────────────────────────────────

  describe('getPreferences', () => {
    it('returns existing preferences', async () => {
      const prefs = makePreferences();
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(prefs);

      const result = await notificationService.getPreferences('user-uuid-1');

      expect(result).toEqual(prefs);
      expect(mockPrisma.notificationPreference.create).not.toHaveBeenCalled();
    });

    it('creates default preferences if not found', async () => {
      const defaultPrefs = makePreferences();
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      mockPrisma.notificationPreference.create.mockResolvedValue(defaultPrefs);

      const result = await notificationService.getPreferences('user-uuid-1');

      expect(result).toEqual(defaultPrefs);
      expect(mockPrisma.notificationPreference.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid-1',
          bookingUpdates: true,
          promotional: true,
          reminders: true,
        },
      });
    });
  });

  // ── updatePreferences ──────────────────────────────────────────────

  describe('updatePreferences', () => {
    it('upserts preferences correctly', async () => {
      const updatedPrefs = makePreferences({ promotional: false });
      mockPrisma.notificationPreference.upsert.mockResolvedValue(updatedPrefs);

      const result = await notificationService.updatePreferences('user-uuid-1', {
        promotional: false,
      });

      expect(result.promotional).toBe(false);
      expect(mockPrisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        create: {
          userId: 'user-uuid-1',
          bookingUpdates: true,
          promotional: false,
          reminders: true,
        },
        update: { promotional: false },
      });
    });

    it('handles partial update with defaults', async () => {
      const prefs = makePreferences({ reminders: false });
      mockPrisma.notificationPreference.upsert.mockResolvedValue(prefs);

      const result = await notificationService.updatePreferences('user-uuid-1', {
        reminders: false,
      });

      expect(result.reminders).toBe(false);
      expect(result.bookingUpdates).toBe(true);
    });
  });

  // ── sendBookingConfirmation ──────────────────────────────────────────────

  describe('sendBookingConfirmation', () => {
    it('creates booking confirmation notification with correct data', async () => {
      const notification = makeNotification();
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await notificationService.sendBookingConfirmation(
        'user-uuid-1',
        'BK-20260101-ABCD',
        'booking-uuid-1',
      );

      expect(result).toBeDefined();
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            type: 'BOOKING_CONFIRMATION',
            titleEn: 'Booking Confirmed',
            deepLink: 'booking://booking-uuid-1',
          }),
        }),
      );
    });
  });

  // ── sendOtpDelivery ──────────────────────────────────────────────

  describe('sendOtpDelivery', () => {
    it('creates OTP delivery notification with correct data', async () => {
      const notification = makeNotification({ type: 'OTP_DELIVERY' });
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await notificationService.sendOtpDelivery(
        'user-uuid-1',
        'BK-20260101-ABCD',
        'booking-uuid-1',
        '123456',
      );

      expect(result).toBeDefined();
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            type: 'OTP_DELIVERY',
            titleEn: 'Your Verification Code',
            deepLink: 'booking://booking-uuid-1',
          }),
        }),
      );
      // Verify OTP code is in the body
      const createCall = mockPrisma.notification.create.mock.calls[0][0];
      expect(createCall.data.bodyEn).toContain('123456');
    });
  });

  // ── sendStatusChange ──────────────────────────────────────────────

  describe('sendStatusChange', () => {
    it('creates status change notification', async () => {
      const notification = makeNotification({ type: 'BOOKING_STATUS_CHANGE' });
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await notificationService.sendStatusChange(
        'user-uuid-1',
        'BK-20260101-ABCD',
        'booking-uuid-1',
        'CONFIRMED',
      );

      expect(result).toBeDefined();
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'BOOKING_STATUS_CHANGE',
          }),
        }),
      );
      const createCall = mockPrisma.notification.create.mock.calls[0][0];
      expect(createCall.data.bodyEn).toContain('CONFIRMED');
    });
  });

  // ── sendPaymentConfirmation ──────────────────────────────────────────────

  describe('sendPaymentConfirmation', () => {
    it('creates payment confirmation notification with amount', async () => {
      const notification = makeNotification({ type: 'PAYMENT_CONFIRMATION' });
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await notificationService.sendPaymentConfirmation(
        'user-uuid-1',
        'BK-20260101-ABCD',
        'booking-uuid-1',
        250.50,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PAYMENT_CONFIRMATION',
          }),
        }),
      );
      const createCall = mockPrisma.notification.create.mock.calls[0][0];
      expect(createCall.data.bodyEn).toContain('250.50');
    });
  });
});
