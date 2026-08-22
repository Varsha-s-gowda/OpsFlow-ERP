import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting old items...');
  const oldItems = await prisma.item.findMany({
    where: {
      sku: {
        startsWith: 'SKU-'
      }
    }
  });

  for (const item of oldItems) {
    console.log('Deleting related data for item:', item.sku);
    await prisma.inventory.deleteMany({ where: { itemId: item.id } });
    await prisma.batch.deleteMany({ where: { itemId: item.id } });
    await prisma.item.delete({ where: { id: item.id } });
  }
  console.log('Done deleting old items.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });