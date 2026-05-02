import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createReimbursementSchema } from '../schemas/reimbursementSchema';

export class ReimbursementService {
  
  async create(employeeId: string, data: z.infer<typeof createReimbursementSchema>) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.isActive) {
      throw new Error('Category is invalid or inactive');
    }

    return prisma.$transaction(async (tx) => {
      const reimbursement = await tx.reimbursement.create({
        data: {
          description: data.description,
          amount: data.amount,
          expenseDate: new Date(data.expenseDate),
          categoryId: data.categoryId,
          employeeId,
          status: 'DRAFT',
        },
      });

      await tx.reimbursementHistory.create({
        data: {
          action: 'CREATED',
          reimbursementId: reimbursement.id,
          authorId: employeeId,
          notes: 'Reimbursement draft created',
        },
      });

      return reimbursement;
    });
  }

  async findAll(user: { id: string; role: string }) {
    if (user.role === 'EMPLOYEE') {
      return prisma.reimbursement.findMany({
        where: { employeeId: user.id },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'MANAGER') {
      return prisma.reimbursement.findMany({
        where: { status: 'SUBMITTED' },
        include: { 
          category: true, 
          employee: { select: { id: true, name: true, email: true } } 
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'FINANCE') {
      return prisma.reimbursement.findMany({
        where: { status: 'APPROVED' },
        include: { 
          category: true, 
          employee: { select: { id: true, name: true, email: true } } 
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'ADMIN') {
      return prisma.reimbursement.findMany({
        include: { 
          category: true, 
          employee: { select: { id: true, name: true, email: true } } 
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return [];
  }

  async findById(id: string, user: { id: string; role: string }) {
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: {
        category: true,
        employee: { select: { id: true, name: true, email: true } },
        history: { 
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true } }
          }
        },
        attachments: true
      }
    });

    if (!reimbursement) {
      throw new Error('Reimbursement not found');
    }

    // apenas EMPLOYEE sao restritos. 
    if (user.role === 'EMPLOYEE' && reimbursement.employeeId !== user.id) {
      throw new Error('Unauthorized access to this reimbursement');
    }

    return reimbursement;
  }

  async submit(id: string, user: { id: string; role: string }) {
    
    if (user.role !== 'EMPLOYEE') {
    throw new Error('Only EMPLOYEE can submit reimbursements');
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.employeeId !== user.id) {
    throw new Error('Only the owner can submit this reimbursement');
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new Error('Only DRAFT reimbursements can be submitted');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'SUBMITTED' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'SUBMITTED', reimbursementId: id, authorId: user.id, notes: 'Reimbursement submitted for approval' }
      });
      return updated;
    });
  }

  async approve(id: string, user: { id: string; role: string }) {
    if (user.role !== 'MANAGER') {
      throw new Error('Only MANAGER can approve reimbursements');
    }
    const reimbursement = await this.findById(id, user);
    if (reimbursement.status !== 'SUBMITTED') {
      throw new Error('Only SUBMITTED reimbursements can be approved');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'APPROVED', reimbursementId: id, authorId: user.id, notes: 'Reimbursement approved' }
      });
      return updated;
    });
  }

  async reject(id: string, reason: string, user: { id: string; role: string }) {
  if (user.role !== 'MANAGER') {
    throw new Error('Only MANAGER can reject reimbursements');
  }

  const reimbursement = await this.findById(id, user);

  if (reimbursement.status !== 'SUBMITTED') {
    throw new Error('Only SUBMITTED reimbursements can be rejected');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reimbursement.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    await tx.reimbursementHistory.create({
      data: {
        action: 'REJECTED',
        reimbursementId: id,
        authorId: user.id,
        notes: `Rejected: ${reason}`,
      },
    });
    return updated;
  });
}

  async pay(id: string, user: { id: string; role: string }) {
    if (user.role !== 'FINANCE') {
      throw new Error('Only FINANCE can pay reimbursements');
    }
    const reimbursement = await this.findById(id, user);
    if (reimbursement.status !== 'APPROVED') {
      throw new Error('Only APPROVED reimbursements can be paid');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'PAID' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'PAID', reimbursementId: id, authorId: user.id, notes: 'Reimbursement paid' }
      });
      return updated;
    });
  }

  async cancel(id: string, user: { id: string; role: string }) {
    
    if (user.role !== 'EMPLOYEE') {
    throw new Error('Only EMPLOYEE can cancel reimbursements');
  }
    const reimbursement = await this.findById(id, user);
    
    if (reimbursement.employeeId !== user.id) {
       throw new Error('Only the owner can cancel this reimbursement');
    }
    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new Error('Only DRAFT or SUBMITTED reimbursements can be canceled');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: { status: 'CANCELED' }
      });
      await tx.reimbursementHistory.create({
        data: { action: 'CANCELED', reimbursementId: id, authorId: user.id, notes: 'Reimbursement canceled' }
      });
      return updated;
    });
  }
}
