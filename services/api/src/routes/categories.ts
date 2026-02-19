import { Router } from 'express';
import { SERVICE_CATEGORIES } from '@fundi-wangu/shared-types';

export const categoriesRouter = Router();

/** GET /api/v1/categories — List all service categories (bilingual, public) */
categoriesRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: SERVICE_CATEGORIES,
    meta: null,
    error: null,
  });
});
