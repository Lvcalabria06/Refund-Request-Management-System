import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
import { idParamSchema } from '../schemas/commonSchema';
import { ZodError } from 'zod';

const userService = new UserService();

function handleError(res: Response, error: any) {
  if (error instanceof ZodError) return res.status(400).json({ errors: error.issues });

  const message: string = error.message ?? 'Internal server error';
  if (message.includes('not found'))               return res.status(404).json({ error: message });
  if (message === 'Email already in use')          return res.status(409).json({ error: message });
  if (message.includes('cannot deactivate your own') ||
      message.includes('cannot change your own'))  return res.status(403).json({ error: message });
  if (message.includes('not deactivated'))         return res.status(409).json({ error: message });

  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      res.status(200).json(await userService.getAll());
    } catch (error: any) { handleError(res, error); }
  }

  async getDeleted(req: Request, res: Response) {
    try {
      res.status(200).json(await userService.getDeleted());
    } catch (error: any) { handleError(res, error); }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      res.status(200).json(await userService.findById(id));
    } catch (error: any) { handleError(res, error); }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      res.status(201).json(await userService.create(validatedData));
    } catch (error: any) { handleError(res, error); }
  }

  async update(req: Request, res: Response) {
    try {
      const requesterId = req.user!.id;
      const { id } = idParamSchema.parse(req.params);
      const validatedData = updateUserSchema.parse(req.body);
      res.status(200).json(await userService.update(id, validatedData, requesterId));
    } catch (error: any) { handleError(res, error); }
  }

  /** Soft-delete: sets deletedAt + revokes refresh tokens */
  async deactivate(req: Request, res: Response) {
    try {
      const requesterId = req.user!.id;
      const { id } = idParamSchema.parse(req.params);
      await userService.deactivate(id, requesterId);
      res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error: any) { handleError(res, error); }
  }

  /** Restore a soft-deleted user */
  async restore(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      await userService.restore(id);
      res.status(200).json({ message: 'User restored successfully' });
    } catch (error: any) { handleError(res, error); }
  }
}
