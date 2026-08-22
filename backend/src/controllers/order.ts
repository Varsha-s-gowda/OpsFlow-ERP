import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if ((req as any).user.role !== 'SALES') {
      res.status(403).json({ success: false, message: 'Forbidden: Only SALES role can create orders' });
      return;
    }

    const { orderId, items } = req.body;

    const existing = await prisma.customerOrder.findUnique({
      where: { orderId },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'Order ID already exists' });
      return;
    }
    const itemMap = new Map<string, number>();
    for (const item of items) {
      itemMap.set(item.itemId, (itemMap.get(item.itemId) || 0) + item.quantity);
    }
    const normalizedItems = Array.from(itemMap.entries()).map(([itemId, quantity]) => ({ itemId, quantity }));
    for (const item of normalizedItems) {
      const itemRecord = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (!itemRecord) {
        res.status(404).json({ success: false, message: `Item not found: ${item.itemId}` });
        return;
      }
    }
    normalizedItems.sort((a, b) => a.itemId.localeCompare(b.itemId));

    let createdOrderWithDetails: any = null;

    await prisma.$transaction(async (tx) => {
      for (const item of normalizedItems) {
        const inventories = await tx.inventory.findMany({
          where: { itemId: item.itemId },
          orderBy: { id: 'asc' },
        });

        const totalAvailable = inventories.reduce((sum: number, inv: any) => {
          const av = inv.physicalQuantity - inv.reservedQuantity;
          return sum + (av > 0 ? av : 0);
        }, 0);

        if (totalAvailable < item.quantity) {
          throw {
            status: 409,
            message: `Insufficient available inventory for this item.`,
          };
        }

        let remaining = item.quantity;
        for (const inv of inventories) {
          if (remaining <= 0) break;
          const av = inv.physicalQuantity - inv.reservedQuantity;
          if (av <= 0) continue;

          const toReserve = Math.min(av, remaining);
          const updatedRows = await tx.$executeRawUnsafe(
            `UPDATE "Inventory" SET "reservedQuantity" = "reservedQuantity" + $1 WHERE "id" = $2 AND "reservedQuantity" + $1 <= "physicalQuantity"`,
            toReserve,
            inv.id
          );

          if (updatedRows === 0) {
            throw { status: 409, message: 'Stock reservation conflict under concurrent update.' };
          }

          remaining -= toReserve;
        }

        if (remaining > 0) {
          throw { status: 409, message: 'Failed to fully allocate reservation.' };
        }
      }
      const order = await tx.customerOrder.create({
        data: {
          orderId,
          createdByUserId: (req as any).user.id,
          status: 'CONFIRMED',
        },
      });
      for (const item of normalizedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemId: item.itemId,
            quantity: item.quantity,
          },
        });
      }
      createdOrderWithDetails = await tx.customerOrder.findUnique({
        where: { id: order.id },
        include: {
          orderItems: { include: { item: true } },
          createdByUser: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    });

    if (!createdOrderWithDetails) {
      res.status(500).json({ success: false, message: 'Failed to process order' });
      return;
    }

    const formatted = {
      orderId: createdOrderWithDetails.orderId,
      status: createdOrderWithDetails.status,
      createdBy: {
        id: createdOrderWithDetails.createdByUser.id,
        name: createdOrderWithDetails.createdByUser.name,
        role: createdOrderWithDetails.createdByUser.role,
      },
      items: createdOrderWithDetails.orderItems.map((oi: any) => ({
        itemId: oi.itemId,
        itemName: oi.item.name,
        quantity: oi.quantity,
      })),
    };

    res.status(201).json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      next(error);
    }
  }
};

export const listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if ((req as any).user.role !== 'SALES' && (req as any).user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const orders = await prisma.customerOrder.findMany({
      include: {
        orderItems: { include: { item: true } },
        createdByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map((order) => ({
      id: order.id,
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: {
        id: order.createdByUser.id,
        name: order.createdByUser.name,
        role: order.createdByUser.role,
      },
      items: order.orderItems.map((oi) => ({
        itemId: oi.itemId,
        itemName: oi.item.name,
        quantity: oi.quantity,
      })),
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if ((req as any).user.role !== 'SALES' && (req as any).user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const { id } = req.params;
    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        orderItems: { include: { item: true } },
        createdByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const formatted = {
      id: order.id,
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      createdBy: {
        id: order.createdByUser.id,
        name: order.createdByUser.name,
        role: order.createdByUser.role,
      },
      items: order.orderItems.map((oi) => ({
        itemId: oi.itemId,
        itemName: oi.item.name,
        quantity: oi.quantity,
      })),
    };

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.customerOrder.update({
      where: { id },
      data: { status }
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.customerOrder.delete({ where: { id } });
    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};
