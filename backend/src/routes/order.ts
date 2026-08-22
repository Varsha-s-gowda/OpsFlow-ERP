import { Router } from 'express';
import { createOrder, listOrders, getOrderById, updateOrder, deleteOrder } from '../controllers/order';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createOrderSchema } from '../validators/order';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Route to create a customer order (SALES role only)
router.post('/', authorizeRoles(Role.SALES), validateRequest(createOrderSchema), createOrder);

// Routes to list or get specific customer orders (SALES or ADMIN)
router.get('/', authorizeRoles(Role.SALES, Role.ADMIN), listOrders);
router.get('/:id', authorizeRoles(Role.SALES, Role.ADMIN), getOrderById);

router.patch('/:id', authorizeRoles(Role.ADMIN, Role.OPERATIONS), updateOrder);
router.delete('/:id', authorizeRoles(Role.ADMIN, Role.OPERATIONS), deleteOrder);

export default router;
