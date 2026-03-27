import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';

// ---------------------------------------------------------------------------
// Business Settings (key-value store)
// ---------------------------------------------------------------------------

export async function getAllSettings() {
  const settings = await prisma.businessSetting.findMany();
  const result: Record<string, unknown> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}

export async function updateSettings(settings: Record<string, string>, staffId?: string) {
  const operations = Object.entries(settings).map(([key, value]) =>
    prisma.businessSetting.upsert({
      where: { key },
      update: { value: value as any, updatedByStaffId: staffId ?? null },
      create: { key, value: value as any, updatedByStaffId: staffId ?? null },
    }),
  );
  await prisma.$transaction(operations);
  return getAllSettings();
}

// ---------------------------------------------------------------------------
// Platform Config (single-row key-value store)
// ---------------------------------------------------------------------------

export async function getPlatformConfig() {
  const configs = await prisma.platformConfig.findMany();
  const result: Record<string, unknown> = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return result;
}

export async function updatePlatformConfig(data: Record<string, unknown>) {
  const operations = Object.entries(data).map(([key, value]) =>
    prisma.platformConfig.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    }),
  );
  await prisma.$transaction(operations);
  return getPlatformConfig();
}

// ---------------------------------------------------------------------------
// User Addresses
// ---------------------------------------------------------------------------

export async function getAddresses(userId: string) {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(
  userId: string,
  data: { label: string; fullAddress: string; latitude?: number | null; longitude?: number | null; isDefault?: boolean },
) {
  const count = await prisma.userAddress.count({ where: { userId } });
  if (count >= 10) {
    throw AppError.badRequest('Maximum of 10 addresses allowed');
  }

  if (data.isDefault) {
    await prisma.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  return prisma.userAddress.create({
    data: {
      userId,
      label: data.label,
      fullAddress: data.fullAddress,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      isDefault: data.isDefault ?? false,
    },
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: { label?: string; fullAddress?: string; latitude?: number | null; longitude?: number | null; isDefault?: boolean },
) {
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!address) throw AppError.notFound('Address not found');

  if (data.isDefault) {
    await prisma.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  return prisma.userAddress.update({ where: { id: addressId }, data });
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!address) throw AppError.notFound('Address not found');
  await prisma.userAddress.delete({ where: { id: addressId } });
  return { message: 'Address deleted successfully' };
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
  if (!address) throw AppError.notFound('Address not found');

  await prisma.$transaction([
    prisma.userAddress.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    prisma.userAddress.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);

  return prisma.userAddress.findUnique({ where: { id: addressId } });
}

// ---------------------------------------------------------------------------
// Support Contact
// ---------------------------------------------------------------------------

export async function getSupportContact() {
  const keys = ['support_phone', 'support_email', 'emergency_phone'];
  const settings = await prisma.businessSetting.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, string | null> = {
    supportPhone: null,
    supportEmail: null,
    emergencyPhone: null,
  };

  for (const s of settings) {
    if (s.key === 'support_phone') result.supportPhone = s.value as string;
    if (s.key === 'support_email') result.supportEmail = s.value as string;
    if (s.key === 'emergency_phone') result.emergencyPhone = s.value as string;
  }

  return result;
}
