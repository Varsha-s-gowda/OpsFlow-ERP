import express from 'express';
import cors from 'cors';
import routes from './routes/auth';
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

// Centralized Error Handling
app.use(errorHandler);

export default app;
