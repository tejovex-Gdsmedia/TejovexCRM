import prisma from '../config/database';
import { AppError } from '../middleware/errorhandler';
import { CreateCompanyInput, UpdateCompanyInput } from '../validators/company.validator';

export class CompanyService {

async getAll(search?: string) {
  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      contacts: {
        where: { deletedAt: null },
      },
      _count: {
        select: {
          contacts: true,
          deals: true,
        },
      },
      // 👇 Add this to get deals with WON status
      deals: {
        where: {
          deletedAt: null,
          status: 'WON',
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 👇 Map over to add wonDealsCount
  return companies.map(company => ({
    ...company,
    wonDealsCount: company.deals.length,
  }));
}

  async getById(id: string) {
    const company = await prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        contacts: {
          where: { deletedAt: null },
        },
        deals: {
          where: { deletedAt: null },
        },
      },
    });

    if (!company) throw new AppError('Company not found', 404);
    return company;
  }

  async create(data: CreateCompanyInput) {
    return prisma.company.create({
      data,
    });
  }

  async update(id: string, data: UpdateCompanyInput) {
    await this.getById(id);

    return prisma.company.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.getById(id);

    return prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const companyService = new CompanyService();