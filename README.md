# OpsFlow ERP

## Overview
OpsFlow ERP is a production-oriented, full-stack Operations Enterprise Resource Planning (ERP) platform built as a technical case study. It establishes a robust workspace organization for logistics, warehouse inventory tracking, transfers, work orders, and customer dispatch operations.

---

## Current Phase
**Phase 3 — Customer Orders, Atomicity & Concurrency-Safe Stock Reservation**
This phase implements customer order workflows with multi-item Zod validation, atomic database transactions (`$transaction`), PostgreSQL-level row adjustments, concurrency protection preventing race conditions on inventory reservation, and role restrictions for `SALES` and `ADMIN`.

---

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Vanilla CSS, Lucide Icons
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: JSON Web Token (JWT), bcrypt
- **Validation**: Zod
- **Testing**: Jest, Supertest

---

## Project Structure
```text
opsflow-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL Schema
│   │   └── seed.ts         # Idempotent Database Seeding
│   ├── src/
│   │   ├── config/         # Environment Validator (Zod)
│   │   ├── controllers/    # Auth, Inventory, Work Order, Transfer & Order Handlers
│   │   ├── middleware/     # Auth, RBAC & Error Handlers
│   │   ├── routes/         # Router mounts
│   │   ├── services/       # Prisma DB connection, Inventory business logic
│   │   ├── types/          # Custom TypeScript declarations
│   │   ├── validators/     # Zod Schemas
│   │   └── app.ts          # Express App configuration
│   ├── tests/              # Jest/Supertest Integrations (auth, phase2, phase3)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # ProtectedRoute Guard
│   │   ├── pages/          # Login, Dashboard, Inventory, Work Orders, Transfers, Orders
│   │   ├── services/       # API Clients
│   │   ├── App.tsx         # Router
│   │   └── main.tsx        # Entrypoint
│   ├── package.json
│   └── tsconfig.json
├── package.json            # Monorepo Workspaces Configuration
└── README.md
```

---

## Prerequisites
- **Node.js**: v18.0.0 or later
- **PostgreSQL**: Running instance (Local or Cloud provider like Neon)

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory matching the following configuration:
```env
DATABASE_URL="postgresql://neondb_owner:npg_lzBJYM02HCUd@ep-bold-darkness-azsrfoxm.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="super-secret-key-opsflow-erp-2026-phase-1"
JWT_EXPIRES_IN="1d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

## Database Setup

Run the following commands starting from the **monorepo root**:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Deploy Schema**:
   ```bash
   npx prisma db push
   ```

4. **Seed Database**:
   ```bash
   npm run db:seed
   ```

---

## Running the Application

### Backend dev server
From the `backend` folder:
```bash
npm run dev
```
Starts backend API on port `5000`.

### Frontend dev server
From the `frontend` folder:
```bash
npm run dev
```
Starts development server on port `5173`.

---

## Authentication & RBAC

### Development / Demo Credentials
All users share the same development password: `OpsFlow@123`

| User Name | Email | Role |
| :--- | :--- | :--- |
| **Admin User** | `admin@opsflow.local` | `ADMIN` |
| **Operations User** | `operations@opsflow.local` | `OPERATIONS` |
| **Sales User** | `sales@opsflow.local` | `SALES` |

> [!WARNING]
> These credentials are for local development and review environments only. Never use these values in production.

### API Endpoints
- `GET /api/health` - Health check (unprotected)
- `POST /api/auth/login` - Authenticate user and receive JWT bearer token
- `GET /api/auth/me` - Fetch authenticated user details (requires JWT)

### Phase 1 Role-Testing Endpoints
- `GET /api/auth/admin-test` (Requires Role: `ADMIN`)
- `GET /api/auth/operations-test` (Requires Role: `OPERATIONS`)
- `GET /api/auth/sales-test` (Requires Role: `SALES`)

### Phase 2 Core ERP Modules

#### 1. Inventory Management (ADMIN / OPERATIONS only)
- `GET /api/inventory` - Get all inventory records enriched with `availableQuantity`
- `GET /api/inventory/:id` - Get specific inventory record details
- `POST /api/inventory` - Create inventory record (validates quantities via Zod & business rules)
- `PATCH /api/inventory/:id` - Update physical or reserved quantities (validates `reservedQuantity <= physicalQuantity`)

#### 2. Work Orders (ADMIN only to create, OPERATIONS / ADMIN to view/process)
- `GET /api/work-orders` - List all work orders with calculated shortage
- `GET /api/work-orders/:id` - Fetch specific work order
- `POST /api/work-orders` - Create work order (Calculates initial shortage. Doesn't deduct inventory yet)
- `PATCH /api/work-orders/:id/status` - Advance status lifecycle (`ASSIGNED` → `IN_PROGRESS` → `COMPLETED`)

#### 3. Stock Transfers (OPERATIONS / ADMIN only)
- `GET /api/transfers` - List all stock transfer orders
- `GET /api/transfers/:id` - Fetch specific stock transfer
- `POST /api/transfers` - Create a transfer request (requires source/destination diff, quantity > 0)
- `PATCH /api/transfers/:id/dispatch` - Dispatch transfer: Decreases source stock in a Prisma database transaction with Row Locking.
- `PATCH /api/transfers/:id/receive` - Receive transfer: Increases destination stock in a database transaction. Protects against duplicate receipt.

### Phase 3 Customer Orders & Stock Reservation

#### 1. Customer Orders (SALES to create, ADMIN / SALES to view)
- `GET /api/orders` - List all customer orders with creator and items details
- `GET /api/orders/:id` - Get details of a specific customer order
- `POST /api/orders` - Submit a customer order draft and atomically reserve required stock

#### 2. Concurrency-Safe Stock Reservation Design
- **Atomicity**: The stock allocation, Zod validation checking, item normalization, and order records insertion happen in a single, rollback-safe Prisma database transaction (`$transaction`). If any item stock reservation fails, everything rolls back.
- **Race Condition Protection**: We use atomic SQL updates directly at the database level:
  `UPDATE "Inventory" SET "reservedQuantity" = "reservedQuantity" + $1 WHERE "id" = $2 AND "reservedQuantity" + $1 <= "physicalQuantity"`
  Ensuring exactly 1 row was updated. If multiple concurrent requests trigger, the database guarantees that `reservedQuantity` never exceeds `physicalQuantity`, returning HTTP 409 Conflict if stock is insufficient.
- **Deadlock Prevention**: Payload items are sorted by `itemId` before acquiring updates, ensuring a deterministic lock acquisition sequence.
- **Role Permissions (RBAC)**: Enforced backend security restricts customer order creation solely to `SALES` users. Only `ADMIN` and `SALES` can view orders. `OPERATIONS` access is blocked.

#### 3. Available Quantity Formula
- The available quantity is computed in the backend as:
  `availableQuantity = physicalQuantity - reservedQuantity`
- Customer orders *only* increase the `reservedQuantity` without altering `physicalQuantity` (until full dispatch is triggered in later phases). No partial allocations are permitted.
- Available stock checks are calculated dynamically from the database.
- Cancellation release releases reserved quantity properly in transactions (if implemented). In this phase, cancellation releases are kept in the status foundation.
- Full testing suites run concurrent requests using `Promise.all` to verify that concurrent order requests exceeding available stock fail gracefully with exactly one success and one 409 conflict.
