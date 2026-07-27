import { Request } from 'express';
export interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}