import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import hpp from 'hpp';

import { env } from './config/env.js';
import { pool } from './config/database.js';
import { csrfCookie, csrfToken, verifyCsrf } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { adminBodyLimiter } from './middleware/bodyLimiter.js';

import { authRouter } from './routes/auth.routes.js';
import { gamesRouter } from './routes/games.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { accountRouter } from './routes/account.routes.js';
import { newsletterRouter } from './routes/newsletter.routes.js';
import { supportRouter } from './routes/support.routes.js';
import {
  newsRouter,
  videosRouter,
  downloadsRouter,
  productsRouter,
} from './routes/content.routes.js';
import { adminRouter } from './routes/admin.routes.js';

const PgSession = connectPgSimple(session);

const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  imgSrc: ["'self'", 'data:', 'blob:'],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: ["'self'"],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: env.isProduction ? [] : undefined,
};

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

export function createApp() {
  const app = express();

  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: CSP_DIRECTIVES,
    },

    crossOriginEmbedderPolicy: true,

    crossOriginOpenerPolicy: {
      policy: 'same-origin',
    },

    crossOriginResourcePolicy: {
      policy: 'same-origin',
    },

    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    hsts: env.isProduction
      ? {
          maxAge: 31_536_000,
          includeSubDomains: true,
          preload: true,
        }
      : false,

    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },

    dnsPrefetchControl: {
      allow: false,
    },

    frameguard: {
      action: 'deny',
    },

    noSniff: true,

    xssFilter: true,

    originAgentCluster: true,
  })
);
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        env.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

  app.use(hpp());

  app.use(
    express.json({
      limit: '2mb',
    })
  );

  app.use(cookieParser());
  app.use(csrfCookie);

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60,
      }),
      name: 'deadsmile.sid',
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: SESSION_COOKIE_OPTIONS,
    })
  );

  app.get('/api/csrf', csrfToken);

  app.use('/api', verifyCsrf);

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
      },
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminBodyLimiter, adminRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/newsletter', newsletterRouter);
  app.use('/api/support', supportRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/videos', videosRouter);
  app.use('/api/downloads', downloadsRouter);
  app.use('/api/products', productsRouter);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
const app = createApp();

export default app;