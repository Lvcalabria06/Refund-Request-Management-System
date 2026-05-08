import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { loginSchema } from '../schemas/authSchema';
import { ZodError } from 'zod';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.issues });
      } else {
        res.status(401).json({ error: error.message });
      }
    }
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }
    try {
      const result = await authService.refresh(refreshToken);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {}); // best-effort
    }
    res.status(204).send();
  }
}
