import { Router } from 'express';
import { ReimbursementController } from '../controllers/ReimbursementController';
import { authMiddleware } from '../middlewares/authMiddleware';

const reimbursementRoutes = Router();
const reimbursementController = new ReimbursementController();

reimbursementRoutes.post('/', authMiddleware, reimbursementController.create);
reimbursementRoutes.get('/', authMiddleware, reimbursementController.getAll);
reimbursementRoutes.get('/:id', authMiddleware, reimbursementController.getById);

reimbursementRoutes.post('/:id/submit', authMiddleware, reimbursementController.submit);
reimbursementRoutes.post('/:id/approve', authMiddleware, reimbursementController.approve);
reimbursementRoutes.post('/:id/reject', authMiddleware, reimbursementController.reject);
reimbursementRoutes.post('/:id/pay', authMiddleware, reimbursementController.pay);
reimbursementRoutes.post('/:id/cancel', authMiddleware, reimbursementController.cancel);

reimbursementRoutes.post('/:id/attachments', authMiddleware, reimbursementController.addAttachment);
reimbursementRoutes.get('/:id/history', authMiddleware, reimbursementController.getHistory);

export default reimbursementRoutes;
