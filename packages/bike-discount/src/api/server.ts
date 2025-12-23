import express from 'express';
import { router } from './app';
import { logger } from '@crawlers/base';

const app = express();
app.use(router);
app.listen(3000, () => {
  logger.info('Server running...');
});
