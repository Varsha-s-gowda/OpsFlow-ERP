import express from 'express';
import cors from 'cors';
import routes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import workOrderRoutes from './routes/workOrder';
import transferRoutes from './routes/transfer';
import errorHandler from './middleware/error';
import config from './config';

const app = express();

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api', routes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/transfers', transferRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
