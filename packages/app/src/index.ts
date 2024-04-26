import express from 'express';
import { router as bikeDiscountRoutes } from '@crawlers/bike-discount';
const app = express();

app.get('/', (req, res) => res.send('Main Api running'));
app.use('/bike-discount', bikeDiscountRoutes);

app.listen(3000, () => {
  console.log('Server running...');
});
