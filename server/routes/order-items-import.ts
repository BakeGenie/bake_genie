import { Router } from 'express';
import orderItemsImportHandler from './order-items-import-handler';

const router = Router();

router.use('/api/order-items', orderItemsImportHandler);

export default router;