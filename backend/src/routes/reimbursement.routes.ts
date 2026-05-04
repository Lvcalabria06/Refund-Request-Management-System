import { Router } from 'express';
import { ReimbursementController } from '../controllers/ReimbursementController';
import { authMiddleware } from '../middlewares/authMiddleware';

const reimbursementRoutes = Router();
const reimbursementController = new ReimbursementController();

// CRUD principal de Reimbursement
reimbursementRoutes.post('/', authMiddleware, reimbursementController.create);
reimbursementRoutes.get('/', authMiddleware, reimbursementController.getAll);
reimbursementRoutes.get('/:id', authMiddleware, reimbursementController.getById);
reimbursementRoutes.put('/:id', authMiddleware, reimbursementController.update);

// Workflow de status
reimbursementRoutes.post('/:id/submit', authMiddleware, reimbursementController.submit);
reimbursementRoutes.post('/:id/approve', authMiddleware, reimbursementController.approve);
reimbursementRoutes.post('/:id/reject', authMiddleware, reimbursementController.reject);
reimbursementRoutes.post('/:id/pay', authMiddleware, reimbursementController.pay);
reimbursementRoutes.post('/:id/cancel', authMiddleware, reimbursementController.cancel);

// CRUD de Attachment (sub-recurso)
reimbursementRoutes.post('/:id/attachments', authMiddleware, reimbursementController.addAttachment);
reimbursementRoutes.get('/:id/attachments', authMiddleware, reimbursementController.getAttachments);
reimbursementRoutes.get('/:id/attachments/:attachmentId', authMiddleware, reimbursementController.getAttachmentById);
reimbursementRoutes.put('/:id/attachments/:attachmentId', authMiddleware, reimbursementController.updateAttachment);
reimbursementRoutes.delete('/:id/attachments/:attachmentId', authMiddleware, reimbursementController.deleteAttachment);

// Histórico
reimbursementRoutes.get('/:id/history', authMiddleware, reimbursementController.getHistory);

export default reimbursementRoutes;
