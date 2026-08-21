import { z } from 'zod';

export const createOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  items: z.array(
    z.object({
      itemId: z.string().uuid('Invalid Item ID'),
      quantity: z.number().int().min(1, 'Quantity must be 1 or greater'),
    })
  ).min(1, 'Order must contain at least one item'),
});
