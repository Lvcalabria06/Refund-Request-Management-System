import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
import { idParamSchema } from '../schemas/commonSchema';
import { ZodError } from 'zod';

const userService = new UserService();

function handleError(res: Response, error: any) {
  if (error instanceof ZodError) {
    return res.status(400).json({ errors: error.issues });
  }
  const message: string = error.message ?? 'Internal server error';

  if (message.includes('not found')) return res.status(404).json({ error: message });
  if (message === 'Email already in use') return res.status(409).json({ error: message });
  if (
    message.includes('cannot delete your own') ||
    message.includes('cannot change your own')
  ) {
    return res.status(403).json({ error: message });
  }
  if (message.includes('Cannot delete user with existing')) {
    return res.status(409).json({ error: message });
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAll();
      res.status(200).json(users);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const user = await userService.findById(id);
      res.status(200).json(user);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await userService.create(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const requesterId = req.user!.id;
      const { id } = idParamSchema.parse(req.params);
      const validatedData = updateUserSchema.parse(req.body);
      const user = await userService.update(id, validatedData, requesterId);
      res.status(200).json(user);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const requesterId = req.user!.id;
      const { id } = idParamSchema.parse(req.params);
      await userService.delete(id, requesterId);
      res.status(204).send();
    } catch (error: any) {
      handleError(res, error);
    }
  }
}
