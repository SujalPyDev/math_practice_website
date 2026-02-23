import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const app = express();

if (env.TRUST_PROXY !== false) {
  app.set('trust proxy', env.TRUST_PROXY);
}

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());
app.use(globalLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
