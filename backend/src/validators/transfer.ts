import { z } from 'zod';

export const createTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  sourceLocationId: z.string().uuid('Invalid Source Location ID'),
  destinationLocationId: z.string().uuid('Invalid Destination Location ID'),
  itemId: z.string().uuid('Invalid Item ID'),
  batchId: z.string().uuid('Invalid Batch ID').optional(),
  quantity: z.number().int().min(1, 'Transfer quantity must be 1 or greater'),
});
