import { Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../validators/task.validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorhandler';

export class TaskController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const tasks = await taskService.getAll(search, status, priority);

      res.status(200).json({
        success: true,
        data: tasks,
        total: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      const tasks = await taskService.getMyTasks(req.user.userId);

      res.status(200).json({
        success: true,
        data: tasks,
        total: tasks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Not authorized', 401);

      const validatedData = createTaskSchema.parse(req.body);
      const task = await taskService.create(validatedData, req.user.userId);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await taskService.update(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateTaskStatusSchema.parse(req.body);
      const task = await taskService.updateStatus(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await taskService.delete(req.params.id as string);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();