import { Router } from 'express';
import { login, getMe } from '../controllers/auth';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { loginSchema } from '../validators/auth';
import { Role } from '@prisma/client';
import prisma from '../services/db';

const router = Router();
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OpsFlow ERP API is running',
  });
});
router.post('/auth/login', validateRequest(loginSchema), login);
router.get('/auth/me', authenticate, getMe);
router.get('/items', authenticate, async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({ include: { category: true } });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.post('/items', authenticate, authorizeRoles(Role.ADMIN, Role.OPERATIONS), async (req, res, next) => {
  try {
    const { name, sku, categoryId } = req.body;
    if (!name || !sku || !categoryId) {
      res.status(400).json({ success: false, message: 'name, sku, and categoryId are required' });
      return;
    }
    const existing = await prisma.item.findUnique({ where: { sku } });
    if (existing) {
      res.status(409).json({ success: false, message: `SKU "${sku}" already exists` });
      return;
    }
    const item = await prisma.item.create({ data: { name, sku, categoryId }, include: { category: true } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

router.post('/categories', authenticate, authorizeRoles(Role.ADMIN, Role.OPERATIONS), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) { res.status(409).json({ success: false, message: `Category "${name}" already exists` }); return; }
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json({ success: true, data: category });
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

router.post('/batches', authenticate, authorizeRoles(Role.ADMIN, Role.OPERATIONS), async (req, res, next) => {
  try {
    const { batchNumber, itemId } = req.body;
    if (!batchNumber || !itemId) { res.status(400).json({ success: false, message: 'batchNumber and itemId are required' }); return; }
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    const batch = await prisma.batch.create({ data: { batchNumber, itemId }, include: { item: true } });
    res.status(201).json({ success: true, data: batch });
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
