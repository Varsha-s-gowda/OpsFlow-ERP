import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db';
import { inventoryService } from '../services/inventory';
import { WorkOrderStatus } from '@prisma/client';

async function getShortageInfo(itemId: string, locationId: string, requiredQuantity: number) {
  const availableQuantity = await inventoryService.getAvailableQuantity(itemId, locationId);
  const shortage = Math.max(requiredQuantity - availableQuantity, 0);
  return { availableQuantity, shortage };
}

export const createWorkOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workOrderId, locationId, itemId, requiredQuantity, assignedUserId } = req.body;

    const existingWO = await prisma.workOrder.findUnique({
      where: { workOrderId },
    });
    if (existingWO) {
      res.status(409).json({ success: false, message: 'Work Order ID already exists' });
      return;
    }

    const [item, location, user] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      prisma.location.findUnique({ where: { id: locationId } }),
      prisma.user.findUnique({ where: { id: assignedUserId } }),
    ]);

    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }
    if (!location) {
      res.status(404).json({ success: false, message: 'Location not found' });
      return;
    }
    if (!user) {
      res.status(404).json({ success: false, message: 'Assigned User not found' });
      return;
    }

    const { availableQuantity, shortage } = await getShortageInfo(itemId, locationId, requiredQuantity);

    const record = await prisma.workOrder.create({
      data: {
        workOrderId,
        locationId,
        itemId,
        requiredQuantity,
        assignedUserId,
        status: WorkOrderStatus.ASSIGNED,
      },
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...record,
        availableQuantity,
        shortage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listWorkOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await prisma.workOrder.findMany({
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const enriched = await Promise.all(
      records.map(async (wo) => {
        const { availableQuantity, shortage } = await getShortageInfo(wo.itemId, wo.locationId, wo.requiredQuantity);
        return {
          ...wo,
          availableQuantity,
          shortage,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!wo) {
      res.status(404).json({ success: false, message: 'Work Order not found' });
      return;
    }

    const { availableQuantity, shortage } = await getShortageInfo(wo.itemId, wo.locationId, wo.requiredQuantity);

    res.status(200).json({
      success: true,
      data: {
        ...wo,
        availableQuantity,
        shortage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Work Order not found' });
      return;
    }

    const currentStatus = existing.status;
    const newStatus = status as WorkOrderStatus;

    if (currentStatus === newStatus) {
      res.status(200).json({ success: true, data: existing });
      return;
    }

    let isValidTransition = false;
    if (currentStatus === WorkOrderStatus.ASSIGNED && newStatus === WorkOrderStatus.IN_PROGRESS) {
      isValidTransition = true;
    } else if (currentStatus === WorkOrderStatus.IN_PROGRESS && newStatus === WorkOrderStatus.COMPLETED) {
      isValidTransition = true;
    }

    if (!isValidTransition) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${newStatus}. Permitted flow is ASSIGNED → IN_PROGRESS → COMPLETED.`,
      });
      return;
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: { status: newStatus },
      include: {
        item: true,
        location: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const { availableQuantity, shortage } = await getShortageInfo(updated.itemId, updated.locationId, updated.requiredQuantity);

    res.status(200).json({
      success: true,
      data: {
        ...updated,
        availableQuantity,
        shortage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.workOrder.delete({ where: { id } });
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};
