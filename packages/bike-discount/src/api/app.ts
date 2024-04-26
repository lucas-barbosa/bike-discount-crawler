import { Router } from 'express';
import settingsRoutes from './routes/settings';

const router = Router();
router.get('/', (req, res) => res.send('Bike is running!'));
router.use('/settings', settingsRoutes);
export { router };
