import { Router } from 'express';
import quotesImportHandler from './quotes-import-handler';

const router = Router();

// Change this to match the API endpoint in QuoteImport.tsx ("/api/quotes/import")
router.use('/api/quotes', quotesImportHandler);

export const quotesImportRouter = router;