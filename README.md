# OpsFlow ERP

OpsFlow ERP is a comprehensive Enterprise Resource Planning system designed for modern warehouses, manufacturing facilities, and supply chain operations. It provides real-time tracking of inventory, work orders, stock transfers, and customer orders.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Router, Lucide Icons, Recharts
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (hosted on Neon)
- **Deployment**: Vercel (Frontend), Render (Backend)

## Project Setup

The project uses a monorepo structure with two main directories: `frontend` and `backend`.

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Database Setup

1. Create a PostgreSQL database (e.g., locally or on Neon/Supabase).
2. Inside the `backend` directory, apply the Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Seed the database with the initial user accounts and sample data:
   ```bash
   npm run seed
   ```

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend` folder with the following keys:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:port/dbname"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend` folder with the following key:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

## How to Run

You will need two terminal windows to run both the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Login Credentials

Use the following credentials to access the system (seeded by default):

- **Admin Account**: 
  - Email: `admin@opsflow.com`
  - Password: `password123`
- **Operations Account**: 
  - Email: `ops@opsflow.com`
  - Password: `password123`
- **Sales Account**:
  - Email: `sales@opsflow.com`
  - Password: `password123`

## How to Test

Currently, the system is tested via manual e2e workflows. To test:
1. Log in as an `Admin`.
2. Navigate to **Inventory** and create a new item.
3. Add stock to the item.
4. Navigate to **Work Orders** and create a work order utilizing the inventory item.
5. Verify stock deduction upon work order completion.
6. Check **Transfers** and **Customer Orders** for similar real-time updates.

## Documentation
- [Database Schema & ER Diagram](./docs/database-schema.md)
- [API Documentation](./docs/api.md)
