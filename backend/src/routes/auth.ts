import { Router } from 'express';
import { login, getMe } from '../controllers/auth';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { loginSchema } from '../validators/auth';
import { Role } from '@prisma/client';
import prisma from '../services/db';

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

// Lookup Routes
router.get('/items', authenticate, async (req, res, next) => {
  try {
    const items = await prisma.item.findMany();
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.get('/locations', authenticate, async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany();
    res.json({ success: true, data: locations });
  } catch (err) { next(err); }
});

router.get('/batches', authenticate, async (req, res, next) => {
  try {
    const batches = await prisma.batch.findMany({ include: { item: true } });
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
});

router.get('/users', authenticate, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

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
