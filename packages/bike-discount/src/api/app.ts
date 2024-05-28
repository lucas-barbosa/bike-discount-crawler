import { Router } from 'express';
import categoriesRoutes from './routes/categories';
import settingsRoutes from './routes/settings';

const router = Router();
router.get('/', (req, res) => res.send('Bike is running!'));
router.use('/categories', categoriesRoutes);
router.use('/settings', settingsRoutes);
export { router };
