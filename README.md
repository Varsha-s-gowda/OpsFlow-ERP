# OpsFlow ERP

## Overview
OpsFlow ERP is a production-oriented, full-stack Operations Enterprise Resource Planning (ERP) platform built as a technical case study. It establishes a robust workspace organization for logistics, warehouse inventory tracking, transfers, work orders, and customer dispatch operations.

---

## Current Phase
**Phase 2 — Core Logistics: Inventory, Work Orders & Stock Transfers**
This phase implements real-time inventory management, shortage calculations, transaction-safe internal stock transfers with Row-Level Locking, work order lifecycle management, backend role verification (RBAC), React screens, and Jest integration tests.

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
│   │   ├── controllers/    # Auth, Inventory, Work Order & Transfer Handlers
│   │   ├── middleware/     # Auth, RBAC & Error Handlers
│   │   ├── routes/         # Router mounts
│   │   ├── services/       # Prisma DB connection, Inventory business logic
│   │   ├── types/          # Custom TypeScript declarations
│   │   ├── validators/     # Zod Schemas
│   │   └── app.ts          # Express App configuration
│   ├── tests/              # Jest/Supertest Integrations (auth, phase2)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # ProtectedRoute Guard
│   │   ├── pages/          # Login, Dashboard, Inventory, Work Orders, Transfers
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
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
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
