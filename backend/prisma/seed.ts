import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash password
  const passwordHash = await bcrypt.hash('OpsFlow@123', 10);

  // 1. Seed Users (Idempotent)
  const usersData = [
    {
      email: 'admin@opsflow.local',
      name: 'Admin User',
      role: Role.ADMIN,
      passwordHash,
    },
    {
      email: 'operations@opsflow.local',
      name: 'Operations User',
      role: Role.OPERATIONS,
      passwordHash,
    },
    {
      email: 'sales@opsflow.local',
      name: 'Sales User',
      role: Role.SALES,
      passwordHash,
    },
  ];

  console.log('Seeding users...');
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash: u.passwordHash,
      },
      create: u,
    });
  }

  // 2. Seed Categories
  console.log('Seeding categories...');
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });

  const rawMaterials = await prisma.category.upsert({
    where: { name: 'Raw Materials' },
    update: {},
    create: { name: 'Raw Materials' },
  });

  // 3. Seed Items
  console.log('Seeding items...');
  const item1 = await prisma.item.upsert({
    where: { sku: 'SKU-MICRO-01' },
    update: {},
    create: {
      name: 'Microcontroller board',
      sku: 'SKU-MICRO-01',
      categoryId: electronics.id,
    },
  });

  const item2 = await prisma.item.upsert({
    where: { sku: 'SKU-LCD-10' },
    update: {},
    create: {
      name: 'LCD Display Screen 10-inch',
      sku: 'SKU-LCD-10',
      categoryId: electronics.id,
    },
  });

  const item3 = await prisma.item.upsert({
    where: { sku: 'SKU-COPPER-W' },
    update: {},
    create: {
      name: 'Copper Wire Spool 50m',
      sku: 'SKU-COPPER-W',
      categoryId: rawMaterials.id,
    },
  });

  // 4. Seed Locations
  console.log('Seeding locations...');
  const loc1 = await prisma.location.upsert({
    where: { code: 'LOC-BLR-01' },
    update: {},
    create: {
      name: 'Bangalore Warehouse',
      code: 'LOC-BLR-01',
    },
  });

  const loc2 = await prisma.location.upsert({
    where: { code: 'LOC-MYS-01' },
    update: {},
    create: {
      name: 'Mysore Warehouse',
      code: 'LOC-MYS-01',
    },
  });

  // 5. Seed Batches (For repeatable runs, we clean existing batches/inventory if needed or upsert)
  console.log('Seeding batches...');
  // We can find or create batches. Since batch number does not have unique constraint in schema,
  // we look up or create based on batchNumber and itemId combination.
  const batchData = [
    { batchNumber: 'BAT-2026-001', itemId: item1.id },
    { batchNumber: 'BAT-2026-002', itemId: item2.id },
    { batchNumber: 'BAT-2026-003', itemId: item3.id },
  ];

  const batches: any[] = [];
  for (const b of batchData) {
    const existing = await prisma.batch.findFirst({
      where: { batchNumber: b.batchNumber, itemId: b.itemId },
    });
    if (existing) {
      batches.push(existing);
    } else {
      const created = await prisma.batch.create({
        data: b,
      });
      batches.push(created);
    }
  }

  // 6. Seed Inventory
  console.log('Seeding inventory...');
  // Unique constraint on itemId, locationId, batchId
  const inventoryData = [
    {
      itemId: item1.id,
      locationId: loc1.id,
      batchId: batches[0].id,
      physicalQuantity: 150,
      reservedQuantity: 10,
    },
    {
      itemId: item2.id,
      locationId: loc1.id,
      batchId: batches[1].id,
      physicalQuantity: 80,
      reservedQuantity: 0,
    },
    {
      itemId: item3.id,
      locationId: loc2.id,
      batchId: batches[2].id,
      physicalQuantity: 500,
      reservedQuantity: 50,
    },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.upsert({
      where: {
        itemId_locationId_batchId: {
          itemId: inv.itemId,
          locationId: inv.locationId,
          batchId: inv.batchId,
        },
      },
      update: {
        physicalQuantity: inv.physicalQuantity,
        reservedQuantity: inv.reservedQuantity,
      },
      create: inv,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
