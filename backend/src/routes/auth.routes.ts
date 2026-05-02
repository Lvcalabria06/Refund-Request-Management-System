import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', authController.login);

// Example protected route for testing
authRoutes.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// Example admin-only route for testing
authRoutes.get('/admin', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => {
  res.json({ message: 'Welcome Admin', user: req.user });
});

export default authRoutes;
