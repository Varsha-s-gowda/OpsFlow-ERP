import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Truncating data...');
  await prisma.workOrder.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.item.deleteMany();
  console.log('Done truncating.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });