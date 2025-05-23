import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard';

export const router = Router();

// Get dashboard statistics
router.get('/stats', getDashboardStats);

export default router;