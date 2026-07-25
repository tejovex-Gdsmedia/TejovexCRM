import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { config } from '../config/env';
import { JwtPayload } from '../types/auth.types';

export class AuthService {

  // Register new user
  async register(data: RegisterInput) {

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Get default role if not provided
    let roleId = data.roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'Agent' },
      });
      if (!defaultRole) {
        throw new AppError('Default role not found. Please seed roles first.', 500);
      }
      roleId = defaultRole.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        roleId,
      },
      include: { role: true },
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Login user
  async login(data: LoginInput) {

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact admin.', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Get current user
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.sanitizeUser(user);
  }

  // Generate JWT token
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  // Remove password from user object
  private sanitizeUser(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();