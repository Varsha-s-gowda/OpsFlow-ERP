import { Router } from 'express';
import {
  createInventory,
  updatePhysicalQuantity,
  listInventory,
  getInventoryById,
  getInventoryByItem,
  getInventoryByLocation,
  getInventoryByBatch
} from '../controllers/inventory';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createInventorySchema, updatePhysicalQuantitySchema } from '../validators/inventory';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(Role.ADMIN, Role.OPERATIONS));

router.get('/', listInventory);
router.get('/:id', getInventoryById);
router.post('/', validateRequest(createInventorySchema), createInventory);
router.patch('/:id', validateRequest(updatePhysicalQuantitySchema), updatePhysicalQuantity);
router.get('/item/:itemId', getInventoryByItem);
router.get('/location/:locationId', getInventoryByLocation);
router.get('/batch/:batchId', getInventoryByBatch);

export default router;
