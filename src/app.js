import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import hpp from "hpp";
import { apiReference } from "@scalar/express-api-reference";
import { createSwaggerSpec } from "./config/swagger.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./config/env.js";
import { pool } from "./config/database.js";
import { csrfCookie, csrfToken, verifyCsrf } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { adminBodyLimiter } from "./middleware/bodyLimiter.js";

import { authRouter } from "./routes/auth.routes.js";
import { gamesRouter } from "./routes/games.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { accountRouter } from "./routes/account.routes.js";
import { newsletterRouter } from "./routes/newsletter.routes.js";
import { supportRouter } from "./routes/support.routes.js";
import {
    newsRouter,
    videosRouter,
    downloadsRouter,
    productsRouter,
} from "./routes/content.routes.js";
import { adminRouter } from "./routes/admin.routes.js";

const PgSession = connectPgSimple(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSP_DIRECTIVES = {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
    ],

    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

    fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://fonts.scalar.com",
    ],

    connectSrc: ["'self'", "https://api.scalar.com", env.frontendUrl],
    mediaSrc: ["'self'", "blob:", "https:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: env.isProduction ? [] : [],
};

const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
};

export function createApp() {
    const app = express();

    app.use(
        express.static(path.join(__dirname, "../public"), {
            index: false,
        }),
    );

    if (env.isProduction) {
        app.set("trust proxy", 1);
    }

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: CSP_DIRECTIVES,
            },

            crossOriginEmbedderPolicy: true,

            crossOriginOpenerPolicy: {
                policy: "same-origin",
            },

            crossOriginResourcePolicy: {
                policy: "same-origin",
            },

            referrerPolicy: {
                policy: "strict-origin-when-cross-origin",
            },

            hsts: env.isProduction
                ? {
                      maxAge: 31_536_000,
                      includeSubDomains: true,
                      preload: true,
                  }
                : false,

            permittedCrossDomainPolicies: {
                permittedPolicies: "none",
            },

            dnsPrefetchControl: {
                allow: false,
            },

            frameguard: {
                action: "deny",
            },

            noSniff: true,

            xssFilter: true,

            originAgentCluster: true,
        }),
    );
    app.use((_req, res, next) => {
        res.setHeader(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        );

        next();
    });

    app.use(
        cors({
            origin: env.frontendUrl,
            credentials: true,
            methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "X-CSRF-Token"],
        }),
    );

    app.use(hpp());

    app.use(
        express.json({
            limit: "2mb",
        }),
    );

    app.use(cookieParser());
    app.use(csrfCookie);

    app.use(
        session({
            store: new PgSession({
                pool,
                tableName: "user_sessions",
                createTableIfMissing: true,
                pruneSessionInterval: 60 * 60,
            }),
            name: "deadsmile.sid",
            secret: env.sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: SESSION_COOKIE_OPTIONS,
        }),
    );
    app.get("/", (_req, res) => {
        res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>API Documentation</title>

  <link
    rel="icon"
    href="/favicon.ico"
  >

  <style>
  @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap");
    :root {
      --scalar-background-1: #151515;
      --scalar-background-2: #111111;
      --scalar-color-accent: #ffffff;
      --scalar-color-1: #ffffff;
      --scalar-color-2: #888888;
      --scalar-border-color: #2a2a2a;
    }

    * {
      box-sizing: border-box;
      font-family: "Space Grotesk", sans-serif;
    }

    body {
      margin: 0;
      padding: 40px 20px;
      background-color: var(--scalar-background-1);
      color: var(--scalar-color-1);
      font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      display: flex;
      flex-direction: column;
      align-items: center;

      min-height: 100vh;
    }

    .container {
      max-width: 600px;
      width: 100%;
    }

    .avatar {
      margin-bottom: 10px;

      display: flex;
      justify-content: center;
      align-items: center;
    }

    .avatar img {
      width: 82px;
      height: 82px;
      object-fit: contain;
      display: block;
    }

    .card {
      background-color: var(--scalar-background-2);
      border: 1px solid var(--scalar-border-color);

      padding: 30px;

      border-radius: 12px;

      text-align: center;

      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 8px 0;
      font-size: 22px;
    }

    p {
      color: var(--scalar-color-2);
      font-size: 14px;
      margin: 0 0 20px 0;
    }

    .btn {
      display: inline-block;
      background-color: #ffffff;
      color: #111111;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: opacity 0.2s ease;
    }

    .btn:hover {
      opacity: 0.8;
    }

    .endpoints-list {
      background-color: var(--scalar-background-2);
      border: 1px solid var(--scalar-border-color);
      border-radius: 12px;
      padding: 20px;
    }

    .endpoints-list h3 {
      margin-top: 0;

      font-size: 16px;

      border-bottom: 1px solid var(--scalar-border-color);

      padding-bottom: 10px;
    }

    ul {
      list-style: none;

      padding: 0;
      margin: 0;
    }

    li {
      display: flex;

      align-items: center;
      justify-content: space-between;

      padding: 10px 0;

      border-bottom:
        1px solid rgba(255, 255, 255, 0.05);
    }

    li:last-child {
      border-bottom: none;
    }

    .method {
      font-size: 11px;

      font-weight: 700;

      text-transform: uppercase;

      padding: 4px 8px;

      border-radius: 4px;

      min-width: 48px;

      text-align: center;
    }

    .get {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .post {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .put {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .patch {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .delete {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .options,
    .head {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .endpoint-link {
      color: var(--scalar-color-1);

      text-decoration: none;

      font-family: monospace;

      font-size: 13px;

      flex-grow: 1;

      margin-left: 12px;
    }

    .endpoint-link:hover {
      text-decoration: underline;
      color: #ffffff;
    }
  </style>
</head>

<body>
  <div class="container">

    <div class="avatar">
      <img
        src="/deadsmile-mark.svg"
      >
    </div>

    <div class="card">
      <h1>API</h1>

      <p>
        API running on
        <strong>
          ${
              process.env.NODE_ENV === "production"
                  ? "production"
                  : "development"
          }
        </strong>
        mode.
      </p>

      <a
        class="btn"
        href="/docs"
      >
        View Documentation
      </a>
    </div>

    <div class="endpoints-list">
      <h3>Endpoints</h3>

      <ul id="routes">
        <li>
          <span
            style="
              color: var(--scalar-color-2);
              font-size: 13px;
            "
          >
            Loading...
          </span>
        </li>
      </ul>
    </div>

  </div>

  <script src="/api-home.js" defer></script>
</body>
</html>`);
    });

    app.get("/api/csrf", csrfToken);

    app.use("/api", verifyCsrf);

    app.get("/api/health", (_req, res) => {
        res.status(200).json({
            status: "ok",
            service: "API Documentation",
            environment: process.env.NODE_ENV || "development",
        });
    });

    app.use("/api/auth", authRouter);
    app.use("/api/admin", adminBodyLimiter, adminRouter);
    app.use("/api/games", gamesRouter);
    app.use("/api/search", searchRouter);
    app.use("/api/account", accountRouter);
    app.use("/api/newsletter", newsletterRouter);
    app.use("/api/support", supportRouter);
    app.use("/api/news", newsRouter);
    app.use("/api/videos", videosRouter);
    app.use("/api/downloads", downloadsRouter);
    app.use("/api/products", productsRouter);

    const swaggerSpec = createSwaggerSpec(app);

    app.get("/swagger.json", (_req, res) => {
        res.status(200).json(swaggerSpec);
    });
    app.use(
        "/docs",
        apiReference({
            spec: {
                content: swaggerSpec,
            },
            theme: "default",
            pageTitle: "API Documentation",
            showDeveloperTools: "never",
            documentDownloadType: "none",
            hideClientButton: true,
            hiddenClients: true,
            withDefaultFonts: true,
        }),
    );

    app.use("/api", notFoundHandler);
    app.use(errorHandler);

    return app;
}
const app = createApp();

export default app;
