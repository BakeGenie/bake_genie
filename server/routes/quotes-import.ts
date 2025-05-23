import { Router } from 'express';
import quotesImportHandler from './quotes-import-handler';

const router = Router();

router.use('/api/quotes', quotesImportHandler);

export const quotesImportRouter = router;