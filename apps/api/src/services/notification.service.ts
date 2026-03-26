import { NotificationType } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import { sendPushNotification } from '../utils/push-notification';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  deepLink?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Core CRUD
// ---------------------------------------------------------------------------

/**
 * Create a notification in the database and attempt push delivery (fire-and-forget).
 */
export async function createNotification(data: CreateNotificationData) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      titleEn: data.titleEn,
      titleAr: data.titleAr,
      bodyEn: data.bodyEn,
      bodyAr: data.bodyAr,
      deepLink: data.deepLink ?? null,
      metadata: (data.metadata as any) ?? undefined,
      sentAt: new Date(),
    },
  });

  // Fire-and-forget push notification
  sendPushNotification({
    userId: data.userId,
    title: data.titleEn,
    body: data.bodyEn,
    data: {
      notificationId: notification.id,
      type: data.type,
      ...(data.deepLink ? { deepLink: data.deepLink } : {}),
    },
  }).catch(console.error);

  return notification;
}

/**
 * List notifications for a user with pagination.
 */
export async function listNotifications(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, total, page, limit };
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { count };
}

/**
 * Mark a single notification as read (verifies ownership).
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw AppError.notFound('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all unread notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updatedCount: result.count };
}
// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/**
 * Get notification preferences for a user (creates defaults if not found).
 */
export async function getPreferences(userId: string) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        bookingUpdates: true,
        promotional: true,
        reminders: true,
      },
    });
  }

  return preferences;
}

/**
 * Update notification preferences for a user (upsert).
 */
export async function updatePreferences(
  userId: string,
  data: { bookingUpdates?: boolean; promotional?: boolean; reminders?: boolean },
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      bookingUpdates: data.bookingUpdates ?? true,
      promotional: data.promotional ?? true,
      reminders: data.reminders ?? true,
    },
    update: data,
  });
}

// ---------------------------------------------------------------------------
// Notification helper methods (booking-related)
// ---------------------------------------------------------------------------

/**
 * Send a booking confirmation notification.
 */
export async function sendBookingConfirmation(
  userId: string,
  bookingRef: string,
  bookingId: string,
) {
  return createNotification({
    userId,
    type: 'BOOKING_CONFIRMATION',
    titleEn: 'Booking Confirmed',
    titleAr: 'تم تأكيد الحجز',
    bodyEn: `Your booking ${bookingRef} has been confirmed successfully.`,
    bodyAr: `تم تأكيد حجزك ${bookingRef} بنجاح.`,
    deepLink: `booking://${bookingId}`,
    metadata: { bookingRef, bookingId },
  });
}

/**
 * Send a booking status change notification.
 */
export async function sendStatusChange(
  userId: string,
  bookingRef: string,
  bookingId: string,
  newStatus: string,
) {
  return createNotification({
    userId,
    type: 'BOOKING_STATUS_CHANGE',
    titleEn: 'Booking Status Updated',
    titleAr: 'تحديث حالة الحجز',
    bodyEn: `Your booking ${bookingRef} status has been updated to ${newStatus}.`,
    bodyAr: `تم تحديث حالة حجزك ${bookingRef} إلى ${newStatus}.`,
    deepLink: `booking://${bookingId}`,
    metadata: { bookingRef, bookingId, newStatus },
  });
}

/**
 * Send an OTP delivery notification.
 */
export async function sendOtpDelivery(
  userId: string,
  bookingRef: string,
  bookingId: string,
  otpCode: string,
) {
  return createNotification({
    userId,
    type: 'OTP_DELIVERY',
    titleEn: 'Your Verification Code',
    titleAr: 'رمز التحقق',
    bodyEn: `Your OTP code for booking ${bookingRef} is: ${otpCode}`,
    bodyAr: `رمز التحقق للحجز ${bookingRef} هو: ${otpCode}`,
    deepLink: `booking://${bookingId}`,
    metadata: { bookingRef, bookingId, otpCode },
  });
}

/**
 * Send a payment confirmation notification.
 */
export async function sendPaymentConfirmation(
  userId: string,
  bookingRef: string,
  bookingId: string,
  amount: number,
) {
  return createNotification({
    userId,
    type: 'PAYMENT_CONFIRMATION',
    titleEn: 'Payment Received',
    titleAr: 'تم استلام الدفعة',
    bodyEn: `Payment of ${amount.toFixed(2)} SAR for booking ${bookingRef} has been received.`,
    bodyAr: `تم استلام دفعة بقيمة ${amount.toFixed(2)} ريال للحجز ${bookingRef}.`,
    deepLink: `booking://${bookingId}`,
    metadata: { bookingRef, bookingId, amount },
  });
}
