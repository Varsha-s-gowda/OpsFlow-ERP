# OpsFlow ERP

## Overview
OpsFlow ERP is a production-oriented, full-stack Operations Enterprise Resource Planning (ERP) platform built as a technical case study. It establishes a robust workspace organization for logistics, warehouse inventory tracking, transfers, work orders, and customer dispatch operations.

---

## Current Phase
**Phase 1 — Project Foundation, Database & Authentication**
This phase focuses on the fundamental architecture, data model integration via Prisma ORM with PostgreSQL, JWT-based security middleware, and a responsive role-based access control (RBAC) test console.

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
│   │   ├── controllers/    # Authentication Handlers
│   │   ├── middleware/     # Auth, RBAC & Error Handlers
│   │   ├── routes/         # Router mounts
│   │   ├── services/       # Prisma DB connection client
│   │   ├── types/          # Custom TypeScript declarations
│   │   ├── validators/     # Zod Schemas
│   │   └── app.ts          # Express App configuration
│   ├── tests/              # Jest/Supertest Integrations
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # ProtectedRoute Guard
│   │   ├── pages/          # Login & Dashboard Views
│   │   ├── services/       # API Auth Client
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
These endpoints are designed specifically to verify role restrictions on the backend:
- `GET /api/auth/admin-test` (Requires Role: `ADMIN`)
- `GET /api/auth/operations-test` (Requires Role: `OPERATIONS`)
- `GET /api/auth/sales-test` (Requires Role: `SALES`)
