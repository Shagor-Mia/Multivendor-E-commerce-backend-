import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateToken, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const productController = new ProductController();

router.post('/', authenticateToken, restrictTo('Vendor'), productController.createProduct.bind(productController));
router.get('/', productController.getProducts.bind(productController));
router.get('/vendor/:userId', productController.getVendorProducts.bind(productController));
router.get('/category/:categoryId', productController.getCategoryProducts.bind(productController));

export default router;