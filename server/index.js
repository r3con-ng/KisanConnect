import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './api.js';
import { errors } from './middleware.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('Set JWT_SECRET before starting the server in production.');
  process.exit(1);
}
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api', api);
app.use(errors);

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(dirname, '../dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kisanconnect')
  .then(() => app.listen(port, () => console.log(`KisanConnect API listening on http://localhost:${port}`)))
  .catch(error => { console.error('Could not connect to MongoDB:', error.message); process.exit(1); });
