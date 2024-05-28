import { Router } from 'express';
import { authMiddleware } from '@api/middlewares/authMiddleware';
import { enqueueCategories } from '@api/controllers/categories';

const routes = Router();

routes.post('/enqueue', [authMiddleware, enqueueCategories]);

export default routes;
