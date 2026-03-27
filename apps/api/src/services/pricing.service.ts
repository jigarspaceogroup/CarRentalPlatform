import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';

interface PricingRuleFilters {
  vehicleId?: string;
  categoryId?: string;
  isActive?: boolean;
}

interface DiscountCodeFilters {
  isActive?: boolean;
}

interface RevenueSummaryRow {
  period: string;
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  paymentCount: number;
}

export async function listPricingRules(filters: PricingRuleFilters) {
  const where: Prisma.SeasonalPricingRuleWhereInput = {};

  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const rules = await prisma.seasonalPricingRule.findMany({
    where,
    include: {
      vehicle: {
        select: { id: true, make: true, model: true, licensePlate: true },
      },
      category: {
        select: { id: true, nameEn: true, nameAr: true },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  return rules;
}

export async function createPricingRule(data: {
  vehicleId?: string | null;
  categoryId?: string | null;
  name: string;
  ruleType: 'MULTIPLIER' | 'FIXED_OVERRIDE';
  value: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}) {
  if (!data.vehicleId && !data.categoryId) {
    throw AppError.badRequest('Either vehicleId or categoryId must be provided');
  }

  const overlapWhere: Prisma.SeasonalPricingRuleWhereInput = {
    isActive: true,
    startDate: { lte: data.endDate },
    endDate: { gte: data.startDate },
  };

  if (data.vehicleId) overlapWhere.vehicleId = data.vehicleId;
  if (data.categoryId) overlapWhere.categoryId = data.categoryId;

  const overlappingRules = await prisma.seasonalPricingRule.findMany({
    where: overlapWhere,
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  const rule = await prisma.seasonalPricingRule.create({
    data: {
      vehicleId: data.vehicleId ?? null,
      categoryId: data.categoryId ?? null,
      name: data.name,
      ruleType: data.ruleType,
      value: data.value,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
      category: { select: { id: true, nameEn: true, nameAr: true } },
    },
  });

  return {
    rule,
    warnings: overlappingRules.length > 0
      ? ['This rule overlaps with ' + overlappingRules.length + ' existing rule(s): ' + overlappingRules.map((r) => r.name).join(', ')]
      : [],
  };
}

export async function updatePricingRule(
  id: string,
  data: {
    name?: string;
    ruleType?: 'MULTIPLIER' | 'FIXED_OVERRIDE';
    value?: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    vehicleId?: string | null;
    categoryId?: string | null;
  },
) {
  const existing = await prisma.seasonalPricingRule.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Pricing rule not found');
  }

  return prisma.seasonalPricingRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.ruleType !== undefined && { ruleType: data.ruleType }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
      category: { select: { id: true, nameEn: true, nameAr: true } },
    },
  });
}

export async function deletePricingRule(id: string) {
  const existing = await prisma.seasonalPricingRule.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Pricing rule not found');
  }

  await prisma.seasonalPricingRule.delete({ where: { id } });
}

export async function listDiscountCodes(
  page: number,
  limit: number,
  filters: DiscountCodeFilters,
) {
  const where: Prisma.DiscountCodeWhereInput = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const skip = (page - 1) * limit;

  const [codes, total] = await Promise.all([
    prisma.discountCode.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    }),
    prisma.discountCode.count({ where }),
  ]);

  return { codes, total, page, limit };
}

export async function createDiscountCode(data: {
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minBookingAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  applicableVehicleIds?: string[];
  applicableCategoryIds?: string[];
  startsAt: Date;
  expiresAt: Date;
  isActive?: boolean;
}) {
  const existing = await prisma.discountCode.findUnique({ where: { code: data.code } });
  if (existing) {
    throw AppError.conflict('A discount code with this code already exists');
  }

  return prisma.discountCode.create({
    data: {
      code: data.code,
      description: data.description ?? null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxDiscountAmount: data.maxDiscountAmount ?? null,
      minBookingAmount: data.minBookingAmount ?? null,
      usageLimit: data.usageLimit ?? null,
      perUserLimit: data.perUserLimit ?? null,
      applicableVehicleIds: data.applicableVehicleIds ?? [],
      applicableCategoryIds: data.applicableCategoryIds ?? [],
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
      isActive: data.isActive ?? true,
    },
    include: { _count: { select: { usages: true } } },
  });
}

export async function updateDiscountCode(
  id: string,
  data: {
    code?: string;
    description?: string | null;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    maxDiscountAmount?: number | null;
    minBookingAmount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    applicableVehicleIds?: string[];
    applicableCategoryIds?: string[];
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
  },
) {
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Discount code not found');
  }

  if (data.code && data.code !== existing.code) {
    const duplicate = await prisma.discountCode.findUnique({ where: { code: data.code } });
    if (duplicate) {
      throw AppError.conflict('A discount code with this code already exists');
    }
  }

  return prisma.discountCode.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.discountType !== undefined && { discountType: data.discountType }),
      ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
      ...(data.maxDiscountAmount !== undefined && { maxDiscountAmount: data.maxDiscountAmount }),
      ...(data.minBookingAmount !== undefined && { minBookingAmount: data.minBookingAmount }),
      ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
      ...(data.perUserLimit !== undefined && { perUserLimit: data.perUserLimit }),
      ...(data.applicableVehicleIds !== undefined && { applicableVehicleIds: data.applicableVehicleIds }),
      ...(data.applicableCategoryIds !== undefined && { applicableCategoryIds: data.applicableCategoryIds }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: { _count: { select: { usages: true } } },
  });
}

export async function deleteDiscountCode(id: string) {
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Discount code not found');
  }

  return prisma.discountCode.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function getRevenueSummary(
  startDate?: Date,
  endDate?: Date,
  groupBy: 'day' | 'month' = 'day',
): Promise<RevenueSummaryRow[]> {
  const paymentFilter: Prisma.PaymentWhereInput = { status: 'COMPLETED' };
  if (startDate || endDate) {
    paymentFilter.paidAt = {};
    if (startDate) (paymentFilter.paidAt as any).gte = startDate;
    if (endDate) (paymentFilter.paidAt as any).lte = endDate;
  }

  const refundFilter: Prisma.RefundWhereInput = { status: 'PROCESSED' };
  if (startDate || endDate) {
    refundFilter.processedAt = {};
    if (startDate) (refundFilter.processedAt as any).gte = startDate;
    if (endDate) (refundFilter.processedAt as any).lte = endDate;
  }

  const [payments, refunds] = await Promise.all([
    prisma.payment.findMany({
      where: paymentFilter,
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    }),
    prisma.refund.findMany({
      where: refundFilter,
      select: { amount: true, processedAt: true },
    }),
  ]);

  const dataMap = new Map<string, RevenueSummaryRow>();

  const formatPeriod = (date: Date | null): string => {
    if (!date) return 'Unknown';
    if (groupBy === 'month') {
      return date.toISOString().substring(0, 7);
    }
    return date.toISOString().substring(0, 10);
  };

  payments.forEach((payment) => {
    const period = formatPeriod(payment.paidAt);
    const existing = dataMap.get(period) || {
      period,
      totalRevenue: 0,
      totalRefunds: 0,
      netRevenue: 0,
      paymentCount: 0,
    };
    existing.totalRevenue += Number(payment.amount);
    existing.paymentCount += 1;
    existing.netRevenue = existing.totalRevenue - existing.totalRefunds;
    dataMap.set(period, existing);
  });

  refunds.forEach((refund) => {
    const period = formatPeriod(refund.processedAt);
    const existing = dataMap.get(period) || {
      period,
      totalRevenue: 0,
      totalRefunds: 0,
      netRevenue: 0,
      paymentCount: 0,
    };
    existing.totalRefunds += Number(refund.amount);
    existing.netRevenue = existing.totalRevenue - existing.totalRefunds;
    dataMap.set(period, existing);
  });

  return Array.from(dataMap.values()).sort((a, b) => a.period.localeCompare(b.period));
}