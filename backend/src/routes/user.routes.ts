import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const userRoutes = Router();
const userController = new UserController();

userRoutes.get('/', authMiddleware, roleMiddleware(['ADMIN']), userController.getAll);
userRoutes.post('/', authMiddleware, roleMiddleware(['ADMIN']), userController.create);

export default userRoutes;
