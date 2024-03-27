import express from 'express';
import settingsRoutes from './routes/settings';

const app = express();
app.use('/settings', settingsRoutes);

export { app };
