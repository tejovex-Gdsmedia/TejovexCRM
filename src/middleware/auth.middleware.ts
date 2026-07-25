import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../types/auth.types';
import { AppError } from './errorhandler';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error) {
    next(new AppError('Not authorized. Invalid token.', 401));
  }
};