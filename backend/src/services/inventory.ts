import prisma from './db';

export const inventoryService = {
  async findInventory(itemId: string, locationId: string, batchId: string, tx: any = prisma) {
    return tx.inventory.findUnique({
      where: {
        itemId_locationId_batchId: {
          itemId,
          locationId,
          batchId,
        },
      },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });
  },

  async getAvailableQuantity(itemId: string, locationId: string, tx: any = prisma): Promise<number> {
    const records = await tx.inventory.findMany({
      where: {
        itemId,
        locationId,
      },
    });

    return records.reduce((sum: number, rec: any) => {
      const available = rec.physicalQuantity - rec.reservedQuantity;
      return sum + (available > 0 ? available : 0);
    }, 0);
  },

  validateQuantity(physicalQuantity: number, reservedQuantity: number): void {
    if (physicalQuantity < 0) {
      throw new Error('Physical quantity cannot be negative');
    }
    if (reservedQuantity < 0) {
      throw new Error('Reserved quantity cannot be negative');
    }
    if (reservedQuantity > physicalQuantity) {
      throw new Error('Reserved quantity cannot exceed physical quantity');
    }
  },

  async increasePhysicalQuantity(
    itemId: string,
    locationId: string,
    batchId: string,
    quantity: number,
    tx: any = prisma
  ) {
    if (quantity <= 0) {
      throw new Error('Increase quantity must be greater than zero');
    }

    const existing = await tx.inventory.findUnique({
      where: {
        itemId_locationId_batchId: { itemId, locationId, batchId },
      },
    });

    if (existing) {
      const newPhysical = existing.physicalQuantity + quantity;
      this.validateQuantity(newPhysical, existing.reservedQuantity);
      return tx.inventory.update({
        where: { id: existing.id },
        data: { physicalQuantity: newPhysical },
      });
    } else {
      this.validateQuantity(quantity, 0);
      return tx.inventory.create({
        data: {
          itemId,
          locationId,
          batchId,
          physicalQuantity: quantity,
          reservedQuantity: 0,
        },
      });
    }
  },

  async decreasePhysicalQuantity(
    itemId: string,
    locationId: string,
    batchId: string,
    quantity: number,
    tx: any = prisma
  ) {
    if (quantity <= 0) {
      throw new Error('Decrease quantity must be greater than zero');
    }

    const existing = await tx.inventory.findUnique({
      where: {
        itemId_locationId_batchId: { itemId, locationId, batchId },
      },
    });

    if (!existing) {
      throw new Error('Inventory record not found for subtraction');
    }

    const newPhysical = existing.physicalQuantity - quantity;
    this.validateQuantity(newPhysical, existing.reservedQuantity);

    return tx.inventory.update({
      where: { id: existing.id },
      data: { physicalQuantity: newPhysical },
    });
  },

  async reserveQuantity(
    itemId: string,
    locationId: string,
    batchId: string,
    quantity: number,
    tx: any = prisma
  ) {
    const existing = await tx.inventory.findUnique({
      where: {
        itemId_locationId_batchId: { itemId, locationId, batchId },
      },
    });

    if (!existing) {
      throw new Error('Inventory record not found for reservation');
    }

    const newReserved = existing.reservedQuantity + quantity;
    this.validateQuantity(existing.physicalQuantity, newReserved);

    return tx.inventory.update({
      where: { id: existing.id },
      data: { reservedQuantity: newReserved },
    });
  },
};
export default inventoryService;
