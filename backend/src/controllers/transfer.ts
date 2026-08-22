import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db';
import { inventoryService } from '../services/inventory';
import { TransferStatus } from '@prisma/client';

export const createTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { transferId, sourceLocationId, destinationLocationId, itemId, batchId, quantity } = req.body;

    if (quantity <= 0) {
      res.status(400).json({ success: false, message: 'Transfer quantity must be greater than zero' });
      return;
    }

    if (sourceLocationId === destinationLocationId) {
      res.status(400).json({ success: false, message: 'Source and destination locations must be different' });
      return;
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    const [sourceLoc, destLoc] = await Promise.all([
      prisma.location.findUnique({ where: { id: sourceLocationId } }),
      prisma.location.findUnique({ where: { id: destinationLocationId } }),
    ]);

    if (!sourceLoc) {
      res.status(404).json({ success: false, message: 'Source location not found' });
      return;
    }
    if (!destLoc) {
      res.status(404).json({ success: false, message: 'Destination location not found' });
      return;
    }

    const existing = await prisma.transfer.findUnique({ where: { transferId } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Transfer ID already exists' });
      return;
    }

    if (batchId) {
      const inv = await inventoryService.findInventory(itemId, sourceLocationId, batchId);
      if (!inv) {
        res.status(400).json({ success: false, message: 'Source inventory record not found for this batch' });
        return;
      }
      const available = inv.physicalQuantity - inv.reservedQuantity;
      if (available < quantity) {
        res.status(400).json({ success: false, message: `Insufficient available stock in selected batch. Available: ${available}` });
        return;
      }
    } else {
      const available = await inventoryService.getAvailableQuantity(itemId, sourceLocationId);
      if (available < quantity) {
        res.status(400).json({ success: false, message: `Insufficient available stock. Available: ${available}` });
        return;
      }
    }

    const transfer = await prisma.transfer.create({
      data: {
        transferId,
        sourceLocationId,
        destinationLocationId,
        itemId,
        batchId: batchId || null,
        quantity,
        status: TransferStatus.REQUESTED,
      },
      include: {
        item: true,
        sourceLocation: true,
        destinationLocation: true,
        batch: true,
      },
    });

    res.status(201).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const listTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await prisma.transfer.findMany({
      include: {
        item: true,
        sourceLocation: true,
        destinationLocation: true,
        batch: true,
      },
    });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getTransferById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        item: true,
        sourceLocation: true,
        destinationLocation: true,
        batch: true,
      },
    });

    if (!transfer) {
      res.status(404).json({ success: false, message: 'Transfer not found' });
      return;
    }

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};

export const dispatchTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
      });
      if (!transfer) {
        throw { status: 404, message: 'Transfer not found' };
      }

      if (transfer.status !== TransferStatus.REQUESTED) {
        throw { status: 400, message: `Cannot dispatch transfer in status ${transfer.status}` };
      }

      let inventories: any[] = [];
      if (transfer.batchId) {
        inventories = await tx.$queryRawUnsafe(
          `SELECT id, "batchId", "physicalQuantity", "reservedQuantity" FROM "Inventory" WHERE "itemId" = $1 AND "locationId" = $2 AND "batchId" = $3 FOR UPDATE`,
          transfer.itemId,
          transfer.sourceLocationId,
          transfer.batchId
        );
      } else {
        inventories = await tx.$queryRawUnsafe(
          `SELECT id, "batchId", "physicalQuantity", "reservedQuantity" FROM "Inventory" WHERE "itemId" = $1 AND "locationId" = $2 FOR UPDATE`,
          transfer.itemId,
          transfer.sourceLocationId
        );
      }

      if (!inventories || inventories.length === 0) {
        throw { status: 400, message: 'No source inventory found' };
      }

      const totalAvailable = inventories.reduce((sum: number, inv: any) => {
        const av = inv.physicalQuantity - inv.reservedQuantity;
        return sum + (av > 0 ? av : 0);
      }, 0);

      if (totalAvailable < transfer.quantity) {
        throw { status: 400, message: `Insufficient stock at source location. Available: ${totalAvailable}, Required: ${transfer.quantity}` };
      }

      let remaining = transfer.quantity;
      let allocatedBatchId = transfer.batchId;

      for (const inv of inventories) {
        if (remaining <= 0) break;
        const av = inv.physicalQuantity - inv.reservedQuantity;
        if (av <= 0) continue;

        const toDeduct = Math.min(av, remaining);
        await tx.inventory.update({
          where: { id: inv.id },
          data: { physicalQuantity: inv.physicalQuantity - toDeduct },
        });

        if (!allocatedBatchId) {
          allocatedBatchId = inv.batchId;
        }
        remaining -= toDeduct;
      }

      if (remaining > 0) {
        throw { status: 400, message: 'Could not deduct full transfer quantity' };
      }

      await tx.transfer.update({
        where: { id },
        data: {
          status: TransferStatus.DISPATCHED,
          batchId: allocatedBatchId,
        },
      });
    });

    const updated = await prisma.transfer.findUnique({
      where: { id },
      include: { item: true, sourceLocation: true, destinationLocation: true, batch: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      next(error);
    }
  }
};

export const receiveTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
      });
      if (!transfer) {
        throw { status: 404, message: 'Transfer not found' };
      }

      if (transfer.status === TransferStatus.RECEIVED) {
        throw { status: 409, message: 'Transfer already received' };
      }

      if (transfer.status !== TransferStatus.DISPATCHED) {
        throw { status: 400, message: `Cannot receive transfer in status ${transfer.status}` };
      }

      if (!transfer.batchId) {
        throw { status: 400, message: 'Transfer missing batch context' };
      }

      const destInventory = await tx.inventory.findUnique({
        where: {
          itemId_locationId_batchId: {
            itemId: transfer.itemId,
            locationId: transfer.destinationLocationId,
            batchId: transfer.batchId,
          },
        },
      });

      if (destInventory) {
        await tx.inventory.update({
          where: { id: destInventory.id },
          data: { physicalQuantity: destInventory.physicalQuantity + transfer.quantity },
        });
      } else {
        await tx.inventory.create({
          data: {
            itemId: transfer.itemId,
            locationId: transfer.destinationLocationId,
            batchId: transfer.batchId,
            physicalQuantity: transfer.quantity,
            reservedQuantity: 0,
          },
        });
      }

      await tx.transfer.update({
        where: { id },
        data: { status: TransferStatus.RECEIVED },
      });
    });

    const updated = await prisma.transfer.findUnique({
      where: { id },
      include: { item: true, sourceLocation: true, destinationLocation: true, batch: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      next(error);
    }
  }
};

export const deleteTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.transfer.delete({ where: { id } });
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};
