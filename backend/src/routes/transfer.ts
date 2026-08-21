import { Router } from 'express';
import {
  createTransfer,
  listTransfers,
  getTransferById,
  dispatchTransfer,
  receiveTransfer
} from '../controllers/transfer';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createTransferSchema } from '../validators/transfer';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(Role.ADMIN, Role.OPERATIONS));

router.get('/', listTransfers);
router.get('/:id', getTransferById);
router.post('/', validateRequest(createTransferSchema), createTransfer);
router.patch('/:id/dispatch', dispatchTransfer);
router.patch('/:id/receive', receiveTransfer);

export default router;
