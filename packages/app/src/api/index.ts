import path from 'path';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { ensureLoggedIn } from 'connect-ensure-login';

import { router as barrabesRoutes } from '@crawlers/barrabes';
import { router as bikeDiscountRoutes } from '@crawlers/bike-discount';
import { router as tradeinnRoutes } from '@crawlers/tradeinn';

import queueUi from './queue-ui';
import authRouter from './auth';
import { setupPassportAuth } from './passport';
import { AUTH } from '../config';
import { logger } from '@crawlers/base';

setupPassportAuth();
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret: AUTH.secret,
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h — prevents unbounded session accumulation
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(passport.authenticate('session'));

app.get('/', (req, res) => res.send('Main Api running'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), memory: process.memoryUsage().rss }));
app.use('/', authRouter);
app.use('/barrabes', barrabesRoutes);
app.use('/bike-discount', bikeDiscountRoutes);
app.use('/tradeinn', tradeinnRoutes);
app.use('/admin/queues', ensureLoggedIn({ redirectTo: '/admin/login' }), queueUi);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

export { app as api };
