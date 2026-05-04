import { Request, Response } from 'express';
import { ReimbursementService } from '../services/ReimbursementService';
import { createReimbursementSchema, updateReimbursementSchema, rejectReimbursementSchema, createAttachmentSchema } from '../schemas/reimbursementSchema';
import { idParamSchema } from '../schemas/commonSchema';
import { ZodError } from 'zod';

const reimbursementService = new ReimbursementService();

function handleError(res: Response, error: any) {
  if (error instanceof ZodError) {
    return res.status(400).json({ errors: error.issues });
  }

  const message: string = error.message ?? 'Internal server error';

  if (message.includes('not found')) {
    return res.status(404).json({ error: message });
  }

  if (
    message.includes('Only EMPLOYEE') ||
    message.includes('Only MANAGER') ||
    message.includes('Only FINANCE') ||
    message.includes('owner') ||
    message.includes('Unauthorized')
  ) {
    return res.status(403).json({ error: message });
  }

  const businessRuleErrors = [
  'Only DRAFT', 'Only SUBMITTED', 'Only APPROVED',
  'Category is invalid', 'Expense date cannot',
  'Attachments can only', 'reimbursements can be',
  ];
  const isKnownBusinessError = businessRuleErrors.some(p => message.includes(p));

  if (isKnownBusinessError) {
    return res.status(400).json({ error: message });
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

export class ReimbursementController {
  async create(req: Request, res: Response) {
    try {
      const employeeId = req.user!.id;
      const validatedData = createReimbursementSchema.parse(req.body);
      const reimbursement = await reimbursementService.create(employeeId, validatedData);
      res.status(201).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const validatedData = updateReimbursementSchema.parse(req.body);
      const reimbursement = await reimbursementService.update(id, validatedData, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const user = req.user!;
      const reimbursements = await reimbursementService.findAll(user);
      res.status(200).json(reimbursements);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const reimbursement = await reimbursementService.findById(id, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const reimbursement = await reimbursementService.submit(id, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const reimbursement = await reimbursementService.approve(id, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const { reason } = rejectReimbursementSchema.parse(req.body);
      const reimbursement = await reimbursementService.reject(id, reason, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async pay(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const reimbursement = await reimbursementService.pay(id, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const reimbursement = await reimbursementService.cancel(id, user);
      res.status(200).json(reimbursement);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async addAttachment(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const validatedData = createAttachmentSchema.parse(req.body);
      const attachment = await reimbursementService.addAttachment(id, validatedData, user);
      res.status(201).json(attachment);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAttachments(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const attachments = await reimbursementService.getAttachments(id, user);
      res.status(200).json(attachments);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);
      const history = await reimbursementService.getHistory(id, user);
      res.status(200).json(history);
    } catch (error: any) {
      handleError(res, error);
    }
  }
}
