import { Router } from 'express';
import { authMiddleware } from '@api/middlewares/authMiddleware';
import { listCategoriesDimension, listCategoriesTree, listCategoriesWeight, listDeniedBrands, listOverriedWeightCategories, listSelectedCategories, listViewedCategories, storeCategoriesDimension, storeCategoriesTree, storeCategoriesWeight, storeDeniedBrands, storeOverriedWeightCategories, storeSelectedCategories, storeViewedCategories } from '@api/controllers/settings';

const routes = Router();

routes.get('/denied-brands', [authMiddleware, listDeniedBrands]);
routes.put('/denied-brands', [authMiddleware, storeDeniedBrands]);

routes.get('/selected-categories', [authMiddleware, listSelectedCategories]);
routes.put('/selected-categories', [authMiddleware, storeSelectedCategories]);

routes.get('/categories-dimension', [authMiddleware, listCategoriesDimension]);
routes.put('/categories-dimension', [authMiddleware, storeCategoriesDimension]);

routes.get('/categories-tree', [authMiddleware, listCategoriesTree]);
routes.put('/categories-tree', [authMiddleware, storeCategoriesTree]);

routes.get('/categories-weight', [authMiddleware, listCategoriesWeight]);
routes.put('/categories-weight', [authMiddleware, storeCategoriesWeight]);

routes.get('/viewed-categories', [authMiddleware, listViewedCategories]);
routes.put('/viewed-categories', [authMiddleware, storeViewedCategories]);

routes.get('/override-weight-categories', [authMiddleware, listOverriedWeightCategories]);
routes.put('/override-weight-categories', [authMiddleware, storeOverriedWeightCategories]);

export default routes;
