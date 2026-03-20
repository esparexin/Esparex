import express from 'express';
import * as invoiceController from '../controllers/invoice';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '../validators/finance.validator';

const router = express.Router();

router.post('/', protect, mutationLimiter, validateRequest(Validators.createInvoiceSchema), invoiceController.createInvoice);
router.get('/', protect, invoiceController.getInvoices);
router.get('/:id', protect, validateObjectId, invoiceController.getInvoiceById);

export default router;
