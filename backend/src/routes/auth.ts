import { Router } from 'express';
import { login, getMe } from '../controllers/auth';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { loginSchema } from '../validators/auth';
import { Role } from '@prisma/client';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OpsFlow ERP API is running',
  });
});

// Auth Routes
router.post('/auth/login', validateRequest(loginSchema), login);
router.get('/auth/me', authenticate, getMe);

// Phase 1 Role-Testing Endpoints
router.get('/auth/admin-test', authenticate, authorizeRoles(Role.ADMIN), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin! Authorization test successful.',
  });
});

router.get('/auth/operations-test', authenticate, authorizeRoles(Role.OPERATIONS), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Operations User! Authorization test successful.',
  });
});

router.get('/auth/sales-test', authenticate, authorizeRoles(Role.SALES), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Sales User! Authorization test successful.',
  });
});

export default router;
