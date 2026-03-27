import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Seed initial admin staff member
  const admin = await prisma.staffMember.upsert({
    where: { email: 'admin@carrental.com' },
    update: {},
    create: {
      email: 'admin@carrental.com',
      passwordHash: '$2b$12$LJ3m5Rs0nKMbpZvAqw9e7eGpCVx/FUVHLqN.kPVoK.Jd5tz8GKRO2', // "Admin@123"
      fullName: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Admin staff: ${admin.email}`);

  // Seed vehicle categories
  const sedan = await prisma.vehicleCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nameEn: 'Sedan',
      nameAr: 'سيدان',
      descriptionEn: 'Comfortable sedans for everyday driving',
      descriptionAr: 'سيارات سيدان مريحة للقيادة اليومية',
      sortOrder: 1,
      isActive: true,
    },
  });

  const suv = await prisma.vehicleCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      nameEn: 'SUV',
      nameAr: 'دفع رباعي',
      descriptionEn: 'Spacious SUVs for family and adventure',
      descriptionAr: 'سيارات دفع رباعي واسعة للعائلة والمغامرة',
      sortOrder: 2,
      isActive: true,
    },
  });

  const luxury = await prisma.vehicleCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      nameEn: 'Luxury',
      nameAr: 'فاخرة',
      descriptionEn: 'Premium luxury vehicles',
      descriptionAr: 'سيارات فاخرة مميزة',
      sortOrder: 3,
      isActive: true,
    },
  });

  const economy = await prisma.vehicleCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      nameEn: 'Economy',
      nameAr: 'اقتصادية',
      descriptionEn: 'Budget-friendly economy cars',
      descriptionAr: 'سيارات اقتصادية بأسعار معقولة',
      sortOrder: 4,
      isActive: true,
    },
  });
  console.log(`  ✓ Categories: ${[sedan.nameEn, suv.nameEn, luxury.nameEn, economy.nameEn].join(', ')}`);

  // Seed branches
  const mainBranch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      nameEn: 'Main Branch - Downtown',
      nameAr: 'الفرع الرئيسي - وسط المدينة',
      addressEn: '123 King Fahd Road, Riyadh',
      addressAr: '١٢٣ طريق الملك فهد، الرياض',
      latitude: 24.7136,
      longitude: 46.6753,
      phone: '+966501234567',
      email: 'main@carrental.com',
      isActive: true,
    },
  });

  const airportBranch = await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      nameEn: 'Airport Branch',
      nameAr: 'فرع المطار',
      addressEn: 'King Khalid International Airport, Riyadh',
      addressAr: 'مطار الملك خالد الدولي، الرياض',
      latitude: 24.9574,
      longitude: 46.6989,
      phone: '+966507654321',
      email: 'airport@carrental.com',
      isActive: true,
    },
  });
  console.log(`  ✓ Branches: ${mainBranch.nameEn}, ${airportBranch.nameEn}`);

  // Seed operating hours for both branches
  const branchIds = [mainBranch.id, airportBranch.id];
  for (const branchId of branchIds) {
    for (let day = 0; day < 7; day++) {
      const isFriday = day === 5;
      const openHour = isFriday ? 14 : 8;
      const closeHour = 22;
      await prisma.branchOperatingHour.upsert({
        where: {
          branchId_dayOfWeek: { branchId, dayOfWeek: day },
        },
        update: {},
        create: {
          branchId,
          dayOfWeek: day,
          isClosed: false,
          openTime: new Date(`1970-01-01T${String(openHour).padStart(2, '0')}:00:00.000Z`),
          closeTime: new Date(`1970-01-01T${String(closeHour).padStart(2, '0')}:00:00.000Z`),
        },
      });
    }
  }
  console.log('  ✓ Operating hours set for all branches');

  // Seed business settings
  const settings = [
    { key: 'cancellation_free_hours', value: '24' },
    { key: 'cancellation_fee_percentage', value: '10' },
    { key: 'minimum_rental_days', value: '1' },
    { key: 'tax_rate', value: '0.15' },
    { key: 'currency', value: 'SAR' },
    { key: 'support_phone', value: '+966501234567' },
    { key: 'support_email', value: 'support@carrental.com' },
    { key: 'emergency_phone', value: '+966509999999' },
  ];

  for (const s of settings) {
    await prisma.businessSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log('  ✓ Business settings configured');

  // Seed platform config
  const configs = [
    { key: 'app_name_en', value: 'Car Rental' },
    { key: 'app_name_ar', value: 'تأجير السيارات' },
    { key: 'primary_color', value: '#2563eb' },
    { key: 'cod_enabled', value: 'true' },
    { key: 'loyalty_enabled', value: 'false' },
    { key: 'flexible_plans_enabled', value: 'true' },
  ];

  for (const c of configs) {
    await prisma.platformConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: { key: c.key, value: c.value },
    });
  }
  console.log('  ✓ Platform config set');

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
