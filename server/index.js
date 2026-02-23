import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDatabase } from './src/config/db.js';
import { ensureAdminUser } from './src/utils/bootstrapAdmin.js';

const startServer = async () => {
  await connectDatabase();
  await ensureAdminUser();

  app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
