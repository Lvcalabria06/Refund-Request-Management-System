import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const categoryRoutes = Router();
const categoryController = new CategoryController();

categoryRoutes.get('/', authMiddleware, roleMiddleware(['ADMIN']), categoryController.getAll);
categoryRoutes.get('/active', authMiddleware, categoryController.getActive);
categoryRoutes.post('/', authMiddleware, roleMiddleware(['ADMIN']), categoryController.create);
categoryRoutes.patch('/:id', authMiddleware, roleMiddleware(['ADMIN']), categoryController.update);

export default categoryRoutes;
