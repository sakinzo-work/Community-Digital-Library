import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/src/app';
import { initDatabase } from './backend/src/database/schema';
import { seedDatabase } from './backend/src/database/seed';
import { syncFilesOnStartup } from './backend/src/services/fileStorage';
import { getJwtSecret } from './backend/src/middleware/auth';
import { expireStaleReservations } from './backend/src/services/reservationService';

async function startServer() {
  console.log('Starting Community Digital Library Full-Stack System...');

  // 0. Ensure mandatory JWT secret is present in the environment
  getJwtSecret();

  // 1. Initialize SQLite3 Schema
  await initDatabase();

  // 2. Seed Initial Library Data & Seed Accounts
  await seedDatabase();

  // 2.5 Ensure all persistent files in SQLite are synchronized with disk
  await syncFilesOnStartup();

  // 3. Create Express App with all REST APIs & file upload handlers
  const app = createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  // 4. Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server actively running on http://0.0.0.0:${PORT}`);

    // Run immediate check for stale reservations on startup
    expireStaleReservations().catch((err) => {
      console.error('[Startup Reservation Check] Error:', err);
    });

    // 60-second periodic background sweep for expired claim windows
    setInterval(() => {
      expireStaleReservations().catch((err) => {
        console.error('[Background Reservation Expiry] Error:', err);
      });
    }, 60 * 1000);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Community Digital Library server:', err);
  process.exit(1);
});
