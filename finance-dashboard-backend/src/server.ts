import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/db';
import financeRoutes from './routes/financeRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'Finance dashboard backend is running',
    status: 'ok',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', financeRoutes);

const startServer = async () => {
  const dbConnected = await connectDB();

  if (!dbConnected) {
    console.warn('Server started without a MongoDB connection; API fallback data is enabled.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
