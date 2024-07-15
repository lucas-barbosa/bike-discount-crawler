import { Router } from 'express';
import { authMiddleware } from '@crawlers/base/dist/api/middlewares/auth.middleware';
import { listCategoriesDimension, listCategoriesWeight, listDeniedBrands, listOverriedWeightCategories, listSelectedCategories, listWeightRules, storeCategoriesDimension, storeCategoriesWeight, storeDeniedBrands, storeOverriedWeightCategories, storeSelectedCategories, storeWeightRules } from '@api/controllers/settings';

const routes = Router();

routes.get('/denied-brands', [authMiddleware, listDeniedBrands]);
routes.put('/denied-brands', [authMiddleware, storeDeniedBrands]);

routes.get('/selected-categories', [authMiddleware, listSelectedCategories]);
routes.put('/selected-categories', [authMiddleware, storeSelectedCategories]);

routes.get('/categories-dimension', [authMiddleware, listCategoriesDimension]);
routes.put('/categories-dimension', [authMiddleware, storeCategoriesDimension]);

routes.get('/categories-weight', [authMiddleware, listCategoriesWeight]);
routes.put('/categories-weight', [authMiddleware, storeCategoriesWeight]);

routes.get('/weight-rules', [authMiddleware, listWeightRules]);
routes.put('/weight-rules', [authMiddleware, storeWeightRules]);

routes.get('/override-weight-categories', [authMiddleware, listOverriedWeightCategories]);
routes.put('/override-weight-categories', [authMiddleware, storeOverriedWeightCategories]);

export default routes;
