import path from 'path';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { ensureLoggedIn } from 'connect-ensure-login';

import { router as barrabesRoutes } from '@crawlers/barrabes';
import { router as bikeDiscountRoutes } from '@crawlers/bike-discount';

import queueUi from './queue-ui';
import authRouter from './auth';
import { setupPassportAuth } from './passport';
import { AUTH } from '../config';

setupPassportAuth();
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({ secret: AUTH.secret, saveUninitialized: true, resave: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.authenticate('session'));

app.get('/', (req, res) => res.send('Main Api running'));
app.use('/', authRouter);
app.use('/barrabes', barrabesRoutes);
app.use('/bike-discount', bikeDiscountRoutes);
app.use('/admin/queues', ensureLoggedIn({ redirectTo: '/admin/login' }), queueUi);

export { app as api };
