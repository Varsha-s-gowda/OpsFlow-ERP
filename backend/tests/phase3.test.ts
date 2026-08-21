import request from 'supertest';
import app from '../src/app';
import prisma from '../src/services/db';

describe('Phase 3 - Customer Orders and Stock Reservation Tests', () => {
  jest.setTimeout(30000);

  let adminToken: string;
  let operationsToken: string;
  let salesToken: string;

  let testCategory: any;
  let testItemA: any;
  let testItemB: any;
  let testLocation: any;
  let testBatchA: any;
  let testBatchB: any;
  let testUserSales: any;

  beforeAll(async () => {
    await prisma.$connect();

    // Login for tokens
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@opsflow.local', password: 'OpsFlow@123' });
    adminToken = adminRes.body.data.token;

    const opsRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operations@opsflow.local', password: 'OpsFlow@123' });
    operationsToken = opsRes.body.data.token;

    const salesRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@opsflow.local', password: 'OpsFlow@123' });
    salesToken = salesRes.body.data.token;

    testUserSales = await prisma.user.findFirst({ where: { role: 'SALES' } });

    // Setup fresh test entities
    testCategory = await prisma.category.create({
      data: { name: `Test Category P3 ${Date.now()}` },
    });

    testItemA = await prisma.item.create({
      data: {
        name: 'Item A',
        sku: `SKU-A-${Date.now()}`,
        categoryId: testCategory.id,
      },
    });

    testItemB = await prisma.item.create({
      data: {
        name: 'Item B',
        sku: `SKU-B-${Date.now()}`,
        categoryId: testCategory.id,
      },
    });

    testLocation = await prisma.location.create({
      data: { name: 'P3 Warehouse', code: `P3-${Date.now()}` },
    });

    testBatchA = await prisma.batch.create({
      data: { batchNumber: `BA-${Date.now()}`, itemId: testItemA.id },
    });

    testBatchB = await prisma.batch.create({
      data: { batchNumber: `BB-${Date.now()}`, itemId: testItemB.id },
    });

    // Seed initial inventory for Item A (100 physical, 0 reserved)
    await prisma.inventory.create({
      data: {
        itemId: testItemA.id,
        locationId: testLocation.id,
        batchId: testBatchA.id,
        physicalQuantity: 100,
        reservedQuantity: 0,
      },
    });

    // Seed initial inventory for Item B (50 physical, 0 reserved)
    await prisma.inventory.create({
      data: {
        itemId: testItemB.id,
        locationId: testLocation.id,
        batchId: testBatchB.id,
        physicalQuantity: 50,
        reservedQuantity: 0,
      },
    });
  });

  afterAll(async () => {
    // Cleanup generated items to avoid database clutter
    await prisma.orderItem.deleteMany({
      where: { itemId: { in: [testItemA.id, testItemB.id] } },
    });
    await prisma.customerOrder.deleteMany({
      where: { createdByUserId: testUserSales.id },
    });
    await prisma.inventory.deleteMany({
      where: { itemId: { in: [testItemA.id, testItemB.id] } },
    });
    await prisma.batch.deleteMany({
      where: { id: { in: [testBatchA.id, testBatchB.id] } },
    });
    await prisma.item.deleteMany({
      where: { id: { in: [testItemA.id, testItemB.id] } },
    });
    await prisma.category.delete({ where: { id: testCategory.id } });
    await prisma.location.delete({ where: { id: testLocation.id } });

    await prisma.$disconnect();
  });

  describe('Customer Orders Validation & Role Restrictions', () => {
    it('1. Sales user can create a valid order', async () => {
      const orderId = `ORD-S-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [{ itemId: testItemA.id, quantity: 10 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe(orderId);
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('2. Non-Sales user cannot create an order', async () => {
      const orderId = `ORD-N-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          orderId,
          items: [{ itemId: testItemA.id, quantity: 5 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('3. Cannot create an order with quantity <= 0', async () => {
      const orderId = `ORD-Q-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [{ itemId: testItemA.id, quantity: 0 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('4. Cannot order an item that does not exist', async () => {
      const orderId = `ORD-M-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [{ itemId: '00000000-0000-0000-0000-000000000000', quantity: 5 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('5. Cannot reserve more than available inventory', async () => {
      // Available stock for Item B: 50. Let's request 60.
      const orderId = `ORD-O-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [{ itemId: testItemB.id, quantity: 60 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Inventory Reservation Mechanics', () => {
    it('6, 7, 8. Reservation updates inventory correctly without decreasing physical stock', async () => {
      // Retrieve inventory metrics before reservation
      const invBefore = await prisma.inventory.findFirst({
        where: { itemId: testItemA.id, locationId: testLocation.id },
      });
      const initialPhysical = invBefore?.physicalQuantity || 0;
      const initialReserved = invBefore?.reservedQuantity || 0;
      const initialAvailable = initialPhysical - initialReserved;

      const orderId = `ORD-M-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [{ itemId: testItemA.id, quantity: 30 }],
        });

      expect(res.status).toBe(201);

      const invAfter = await prisma.inventory.findFirst({
        where: { itemId: testItemA.id, locationId: testLocation.id },
      });

      // 6. reservedQuantity increases by 30
      expect(invAfter?.reservedQuantity).toBe(initialReserved + 30);
      // 7. physicalQuantity remains unchanged
      expect(invAfter?.physicalQuantity).toBe(initialPhysical);
      // 8. availableQuantity decreases by 30
      const afterAvailable = (invAfter?.physicalQuantity || 0) - (invAfter?.reservedQuantity || 0);
      expect(afterAvailable).toBe(initialAvailable - 30);
    });

    it('9. Multiple-item order reserves all items atomically', async () => {
      const orderId = `ORD-MULTI-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [
            { itemId: testItemA.id, quantity: 5 },
            { itemId: testItemB.id, quantity: 5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('10. If one item in a multi-item order fails, all reservations rollback and no order is created', async () => {
      // Retrieve inventory metrics before failed order
      const invABefore = await prisma.inventory.findFirst({ where: { itemId: testItemA.id } });
      const invBBefore = await prisma.inventory.findFirst({ where: { itemId: testItemB.id } });

      const orderId = `ORD-FAIL-${Date.now()}`;
      // Requesting 5 of Item A (valid) and 100 of Item B (invalid - exceeds 50 available)
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          orderId,
          items: [
            { itemId: testItemA.id, quantity: 5 },
            { itemId: testItemB.id, quantity: 100 },
          ],
        });

      expect(res.status).toBe(409);

      const invAAfter = await prisma.inventory.findFirst({ where: { itemId: testItemA.id } });
      const invBAfter = await prisma.inventory.findFirst({ where: { itemId: testItemB.id } });

      // Item A reservation must rollback and show no change
      expect(invAAfter?.reservedQuantity).toBe(invABefore?.reservedQuantity);
      expect(invBAfter?.reservedQuantity).toBe(invBBefore?.reservedQuantity);

      // Verify no customer order was created
      const dbOrder = await prisma.customerOrder.findUnique({ where: { orderId } });
      expect(dbOrder).toBeNull();
    });
  });

  describe('Concurrency & Race Condition Controls', () => {
    let freshItem: any;
    let freshBatch: any;

    beforeEach(async () => {
      freshItem = await prisma.item.create({
        data: {
          name: 'Concurrency Test Item',
          sku: `SKU-C-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          categoryId: testCategory.id,
        },
      });

      freshBatch = await prisma.batch.create({
        data: { batchNumber: `BC-${Date.now()}`, itemId: freshItem.id },
      });

      // Seed 100 stock
      await prisma.inventory.create({
        data: {
          itemId: freshItem.id,
          locationId: testLocation.id,
          batchId: freshBatch.id,
          physicalQuantity: 100,
          reservedQuantity: 0,
        },
      });
    });

    afterEach(async () => {
      await prisma.orderItem.deleteMany({ where: { itemId: freshItem.id } });
      await prisma.inventory.deleteMany({ where: { itemId: freshItem.id } });
      await prisma.batch.delete({ where: { id: freshBatch.id } });
      await prisma.item.delete({ where: { id: freshItem.id } });
    });

    it('11. Concurrency test: exactly one of two concurrent requests exceeding total stock succeeds', async () => {
      const orderIdA = `ORD-A-${Date.now()}`;
      const orderIdB = `ORD-B-${Date.now()}`;

      // Order A requests 80, Order B requests 30. Total requested is 110 (exceeds 100 stock)
      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${salesToken}`)
          .send({
            orderId: orderIdA,
            items: [{ itemId: freshItem.id, quantity: 80 }],
          }),
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${salesToken}`)
          .send({
            orderId: orderIdB,
            items: [{ itemId: freshItem.id, quantity: 30 }],
          }),
      ]);

      const codes = [resA.status, resB.status];
      const successes = codes.filter((c) => c === 201).length;
      const conflicts = codes.filter((c) => c === 409).length;

      expect(successes).toBe(1);
      expect(conflicts).toBe(1);

      // Verify the final reserved quantity is exactly the quantity of the successful order (either 80 or 30)
      const finalInv = await prisma.inventory.findFirst({ where: { itemId: freshItem.id } });
      expect(finalInv?.reservedQuantity).toBeLessThanOrEqual(100);
      expect([30, 80]).toContain(finalInv?.reservedQuantity);
    });

    it('12. Two concurrent reservations together cannot make reservedQuantity exceed physicalQuantity', async () => {
      const orderIdX = `ORD-X-${Date.now()}`;
      const orderIdY = `ORD-Y-${Date.now()}`;

      // Both try to reserve 60 (total 120, exceeds 100)
      const [resX, resY] = await Promise.all([
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${salesToken}`)
          .send({
            orderId: orderIdX,
            items: [{ itemId: freshItem.id, quantity: 60 }],
          }),
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${salesToken}`)
          .send({
            orderId: orderIdY,
            items: [{ itemId: freshItem.id, quantity: 60 }],
          }),
      ]);

      const codes = [resX.status, resY.status];
      const successes = codes.filter((c) => c === 201).length;
      const conflicts = codes.filter((c) => c === 409).length;

      expect(successes).toBe(1);
      expect(conflicts).toBe(1);

      const finalInv = await prisma.inventory.findFirst({ where: { itemId: freshItem.id } });
      expect(finalInv?.reservedQuantity).toBe(60);
    });
  });

  describe('RBAC Verification', () => {
    it('13. Unauthorized user cannot access restricted order creation', async () => {
      const orderId = `ORD-U-${Date.now()}`;
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          orderId,
          items: [{ itemId: testItemA.id, quantity: 2 }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
