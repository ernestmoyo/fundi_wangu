import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { locationService } from '../services/location.service.js';

export const locationsRouter = Router();

const createLocationSchema = z.object({
  label: z.string().min(1).max(50),
  address_text: z.string().min(3).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  is_default: z.boolean().optional(),
});

/** GET /api/v1/locations — List saved locations */
locationsRouter.get('/', async (req, res, next) => {
  try {
    const locations = await locationService.listLocations(req.user!.id);
    res.json({ success: true, data: locations, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/locations — Save a new location */
locationsRouter.post('/', validate(createLocationSchema), async (req, res, next) => {
  try {
    const location = await locationService.createLocation(req.user!.id, req.body);
    res.status(201).json({ success: true, data: location, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/locations/:id — Delete a saved location */
locationsRouter.delete('/:id', async (req, res, next) => {
  try {
    await locationService.deleteLocation(req.user!.id, req.params.id!);
    res.json({ success: true, data: null, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
