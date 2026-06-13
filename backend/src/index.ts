import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { redis } from './config/redis';
import router from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' } }));
app.use('/api/clientes/ocr-cnh', rateLimit({ windowMs: 60 * 1000, max: 20 }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, service: 'DM Advogados API', status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ success: false, status: 'db_error' });
  }
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL conectado');
    await redis.connect();
    console.log('✅ Redis conectado');
    app.listen(PORT, () => console.log(`🚀 DM Advogados API rodando na porta ${PORT}`));
  } catch (err) {
    console.error('❌ Erro ao iniciar:', err);
    process.exit(1);
  }
}

start();
