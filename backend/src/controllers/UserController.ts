import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { createUserSchema } from '../schemas/userSchema';
import { ZodError } from 'zod';

const userService = new UserService();

export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAll();
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  async create(req: Request, res: Response) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await userService.create(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.issues });
      } else if (error.message === 'Email already in use') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }
}
