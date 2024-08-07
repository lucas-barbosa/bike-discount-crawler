import express from 'express';
import { router } from './app';

const app = express();
app.use(router);
app.listen(3000, () => {
  console.log('Server running...');
});
