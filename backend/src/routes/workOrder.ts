import { Router } from 'express';
import {
  createWorkOrder,
  listWorkOrders,
  getWorkOrderById,
  updateWorkOrderStatus
} from '../controllers/workOrder';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createWorkOrderSchema, updateWorkOrderStatusSchema } from '../validators/workOrder';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// View work orders
router.get('/', authorizeRoles(Role.ADMIN, Role.OPERATIONS), listWorkOrders);
router.get('/:id', authorizeRoles(Role.ADMIN, Role.OPERATIONS), getWorkOrderById);

// Create work orders
router.post('/', authorizeRoles(Role.ADMIN), validateRequest(createWorkOrderSchema), createWorkOrder);

// Update status
router.patch('/:id/status', authorizeRoles(Role.ADMIN, Role.OPERATIONS), validateRequest(updateWorkOrderStatusSchema), updateWorkOrderStatus);

export default router;
