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

// Read-only inventory routes accessible by Admin, Operations, and Sales
router.get('/', authorizeRoles(Role.ADMIN, Role.OPERATIONS, Role.SALES), listInventory);
router.get('/:id', authorizeRoles(Role.ADMIN, Role.OPERATIONS, Role.SALES), getInventoryById);
router.get('/item/:itemId', authorizeRoles(Role.ADMIN, Role.OPERATIONS, Role.SALES), getInventoryByItem);
router.get('/location/:locationId', authorizeRoles(Role.ADMIN, Role.OPERATIONS, Role.SALES), getInventoryByLocation);
router.get('/batch/:batchId', authorizeRoles(Role.ADMIN, Role.OPERATIONS, Role.SALES), getInventoryByBatch);

// Modification inventory routes restricted to Admin and Operations
router.post('/', authorizeRoles(Role.ADMIN, Role.OPERATIONS), validateRequest(createInventorySchema), createInventory);
router.patch('/:id', authorizeRoles(Role.ADMIN, Role.OPERATIONS), validateRequest(updatePhysicalQuantitySchema), updatePhysicalQuantity);

export default router;
