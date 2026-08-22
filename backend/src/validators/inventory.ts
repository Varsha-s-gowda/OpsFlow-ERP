import { z } from 'zod';

export const createInventorySchema = z.object({
  itemId: z.string().uuid('Invalid Item ID'),
  locationId: z.string().uuid('Invalid Location ID'),
  batchId: z.string().uuid('Invalid Batch ID').optional().nullable(),
  physicalQuantity: z.number().int().min(0, 'Physical quantity must be 0 or greater'),
  reservedQuantity: z.number().int().min(0, 'Reserved quantity must be 0 or greater').default(0),
});

export const updatePhysicalQuantitySchema = z.object({
  physicalQuantity: z.number().int().min(0, 'Physical quantity must be 0 or greater').optional(),
  reservedQuantity: z.number().int().min(0, 'Reserved quantity must be 0 or greater').optional(),
});
