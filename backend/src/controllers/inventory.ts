import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db';
import { inventoryService } from '../services/inventory';

const enrichInventory = (record: any) => ({
  ...record,
  availableQuantity: record.physicalQuantity - record.reservedQuantity,
});

export const createInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId, locationId, batchId, physicalQuantity, reservedQuantity = 0 } = req.body;

    inventoryService.validateQuantity(physicalQuantity, reservedQuantity);

    // Check if combo already exists
    const existing = await prisma.inventory.findUnique({
      where: {
        itemId_locationId_batchId: { itemId, locationId, batchId },
      },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'Inventory record for this combination already exists' });
      return;
    }

    const record = await prisma.inventory.create({
      data: {
        itemId,
        locationId,
        batchId,
        physicalQuantity,
        reservedQuantity,
      },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    res.status(201).json({
      success: true,
      data: enrichInventory(record),
    });
  } catch (error: any) {
    next(error);
  }
};

export const updatePhysicalQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { physicalQuantity, reservedQuantity } = req.body;

    const existing = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Inventory record not found' });
      return;
    }

    const newPhysical = physicalQuantity !== undefined ? physicalQuantity : existing.physicalQuantity;
    const newReserved = reservedQuantity !== undefined ? reservedQuantity : existing.reservedQuantity;

    inventoryService.validateQuantity(newPhysical, newReserved);

    const record = await prisma.inventory.update({
      where: { id },
      data: {
        physicalQuantity: newPhysical,
        reservedQuantity: newReserved,
      },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    res.status(200).json({
      success: true,
      data: enrichInventory(record),
    });
  } catch (error: any) {
    next(error);
  }
};

export const listInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await prisma.inventory.findMany({
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    res.status(200).json({
      success: true,
      data: records.map(enrichInventory),
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await prisma.inventory.findUnique({
      where: { id },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Inventory record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: enrichInventory(record),
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryByItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const records = await prisma.inventory.findMany({
      where: { itemId },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    res.status(200).json({
      success: true,
      data: records.map(enrichInventory),
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryByLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { locationId } = req.params;
    const records = await prisma.inventory.findMany({
      where: { locationId },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    res.status(200).json({
      success: true,
      data: records.map(enrichInventory),
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryByBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { batchId } = req.params;
    const records = await prisma.inventory.findMany({
      where: { batchId },
      include: {
        item: true,
        location: true,
        batch: true,
      },
    });

    res.status(200).json({
      success: true,
      data: records.map(enrichInventory),
    });
  } catch (error) {
    next(error);
  }
};
