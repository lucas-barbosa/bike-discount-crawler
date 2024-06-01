import express from 'express';
import { router as bikeDiscountRoutes } from '@crawlers/bike-discount';
import queueUi from './queue-ui';

const app = express();

app.get('/', (req, res) => res.send('Main Api running'));
app.use('/bike-discount', bikeDiscountRoutes);
app.use('/admin/queues', queueUi);

export { app as api };
