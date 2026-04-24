import cors from 'cors';
import express from 'express';
import { CLIENT_ORIGIN } from './config.js';
import matchRoutes from './routes/matchRoutes.js';
import userRoutes from './routes/userRoutes.js';

function createCorsOrigin() {
  if (CLIENT_ORIGIN === '*') return true;
  return CLIENT_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean);
}

export const corsOptions = {
  origin: createCorsOrigin(),
  credentials: true,
};

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'gamearena-socket-server' });
  });

  app.use('/api', matchRoutes);
  app.use('/api', userRoutes);

  return app;
}
