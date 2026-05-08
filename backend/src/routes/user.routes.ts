import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const userRoutes = Router();
const userController = new UserController();

// Todas as rotas de usuário são restritas ao ADMIN
userRoutes.get('/', authMiddleware, roleMiddleware(['ADMIN']), userController.getAll);
userRoutes.get('/deleted', authMiddleware, roleMiddleware(['ADMIN']), userController.getDeleted);   // soft-deleted list
userRoutes.get('/:id', authMiddleware, roleMiddleware(['ADMIN']), userController.getById);
userRoutes.post('/', authMiddleware, roleMiddleware(['ADMIN']), userController.create);
userRoutes.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), userController.update);
userRoutes.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), userController.deactivate);  // soft-delete
userRoutes.patch('/:id/restore', authMiddleware, roleMiddleware(['ADMIN']), userController.restore);     // restore

export default userRoutes;
