import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

export default app;
export { app };

export function startServer(port = env.port) {
  return app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}
