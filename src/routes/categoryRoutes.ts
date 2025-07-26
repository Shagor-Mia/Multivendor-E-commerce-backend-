import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticateToken, restrictTo } from '../middleware/authMiddleware';

const router = Router();
const categoryController = new CategoryController();

router.post('/', authenticateToken, restrictTo('Admin'), categoryController.createCategory.bind(categoryController));
router.get('/', categoryController.getCategories.bind(categoryController));
router.put('/:categoryId', authenticateToken, restrictTo('Admin'), categoryController.updateCategory.bind(categoryController));
router.delete('/:categoryId', authenticateToken, restrictTo('Admin'), categoryController.deleteCategory.bind(categoryController));

export default router;