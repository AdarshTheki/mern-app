import express from 'express';
import https from 'https';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import passport from 'passport';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initializeSocketIO } from './config/socket.js';
import { morganMiddleware } from './middlewares/logger.middleware.js';
import { routes } from './constant/routes.js';
import './config/passport.js';

// Import All Routing Files
// import { stripeWebhook } from './controllers/order.controller.js';

const app = express();

// ─── Ensure uploads/ directory exists ────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'public/temp');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

https.globalAgent = new https.Agent({ family: 4 });

// app.post(
//   '/api/v1/order/stripe-webhook',
//   express.raw({ type: 'application/json' }),
//   stripeWebhook
// );

const CORS = process.env?.CORS?.split(',') || ['http://localhost:5173'];

app.use(cors({ origin: CORS, credentials: true }));

app.use(express.json({ limit: '16kb' }));

app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../../app/dist')));

app.use(cookieParser());

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 200, // max 100 requests per windowMs
// });

// app.use(limiter);

app.use(morganMiddleware);

// ─── Passport & OAuth used ─────────────────────────────
app.use(passport.initialize());
app.use(
  session({
    secret: process.env.SECRET_TOKEN,
    saveUninitialized: true,
    resave: true,
  })
);

// ─── Socket.Io ──────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS,
    credentials: true,
  },
});
app.set('io', io);
initializeSocketIO(io);

// ─── Routes ─────────────────────────────
routes.forEach((router) => {
  app.use(router.path, router.route);
});

// client side routing static file serving
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../app/dist/index.html'));
});

export default server;
