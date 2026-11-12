import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { createApiRouter, corsOptions } from './routes/index.js';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api', createApiRouter());

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor'
  });
});

export function startServer(port = env.port) {
  return app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
