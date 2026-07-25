import { Response, NextFunction } from 'express';
import { companyService } from '../services/company.service';
import { createCompanySchema, updateCompanySchema } from '../validators/company.validator';
import { AuthRequest } from '../middleware/auth.middleware';


export class CompanyController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const companies = await companyService.getAll(search);

      res.status(200).json({
        success: true,
        data: companies,
        total: companies.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createCompanySchema.parse(req.body);
      const company = await companyService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateCompanySchema.parse(req.body);
      const company = await companyService.update(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Company updated successfully',
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await companyService.delete(req.params.id as string);

      res.status(200).json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();