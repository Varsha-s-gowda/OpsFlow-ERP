import { z } from 'zod';
import { WorkOrderStatus } from '@prisma/client';

export const createWorkOrderSchema = z.object({
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  locationId: z.string().uuid('Invalid Location ID'),
  itemId: z.string().uuid('Invalid Item ID'),
  requiredQuantity: z.number().int().min(1, 'Required quantity must be 1 or greater'),
  assignedUserId: z.string().uuid('Invalid User ID'),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus, {
    errorMap: () => ({ message: 'Invalid Work Order Status (must be ASSIGNED, IN_PROGRESS, or COMPLETED)' }),
  }),
});
