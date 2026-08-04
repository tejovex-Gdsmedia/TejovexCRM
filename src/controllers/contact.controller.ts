import { createContactSchema, updateContactSchema, bulkImportContactsSchema } from '../validators/contact.validator';
import { Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ContactController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const contacts = await contactService.getAll(search);

      res.status(200).json({
        success: true,
        data: contacts,
        total: contacts.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contact = await contactService.getById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createContactSchema.parse(req.body);
      const contact = await contactService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateContactSchema.parse(req.body);
      const contact = await contactService.update(req.params.id as string, validatedData);

      res.status(200).json({
        success: true,
        message: 'Contact updated successfully',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await contactService.delete(req.params.id as string);

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
  async importContacts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed  = bulkImportContactsSchema.parse(req.body);
    const results = await contactService.bulkImport(parsed.contacts);

    res.status(200).json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.skipped} skipped`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}
}

export const contactController = new ContactController();