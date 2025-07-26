import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const paymentController = new PaymentController();

router.post('/create-payment-intent', authenticateToken, restrictTo('User'), paymentController.createPaymentIntent.bind(paymentController));
router.get('/vendor/:userId', authenticateToken, restrictTo('Vendor', 'Admin'), paymentController.getVendorPayments.bind(paymentController));

export default router;