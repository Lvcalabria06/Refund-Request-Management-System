import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createReimbursementSchema, createAttachmentSchema, updateAttachmentSchema } from '../schemas/reimbursementSchema';
import dayjs from 'dayjs';

export class ReimbursementService {

  async create(user: { id: string; role: string }, data: z.infer<typeof createReimbursementSchema>) {
    if (user.role !== 'EMPLOYEE') {
      throw new Error('Only EMPLOYEE can create reimbursements');
    }

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.isActive) {
      throw new Error('Category is invalid or inactive');
    }

    if (category.maxAmount !== null && data.amount > category.maxAmount) {
        throw new Error(
          `Amount exceeds the limit for category "${category.name}". Maximum allowed: R$ ${category.maxAmount.toFixed(2)}`
        );
    }

    const expenseDate = dayjs(data.expenseDate);
    if (expenseDate.isAfter(dayjs())) {
      throw new Error('Expense date cannot be in the future');
    }

    return prisma.$transaction(async (tx) => {
      const reimbursement = await tx.reimbursement.create({
        data: {
          description: data.description,
          amount: data.amount,
          expenseDate: expenseDate.toDate(),
          categoryId: data.categoryId,
          employeeId: user.id,
          status: 'DRAFT',
        },
      });

      await tx.reimbursementHistory.create({
        data: {
          action: 'CREATED',
          reimbursementId: reimbursement.id,
          authorId: user.id,
          notes: 'Reimbursement draft created',
        },
      });

      return reimbursement;
    });
  }
  
  async update(id: string, data: z.infer<typeof import('../schemas/reimbursementSchema').updateReimbursementSchema>, user: { id: string; role: string }) {
    if (user.role !== 'EMPLOYEE') {
      throw new Error('Only EMPLOYEE can update reimbursements');
    }

    const reimbursement = await this.findById(id, user);

    if (reimbursement.employeeId !== user.id) {
      throw new Error('Only the owner can update this reimbursement');
    }

    if (reimbursement.status !== 'DRAFT') {
      throw new Error('Only DRAFT reimbursements can be updated');
    }

    // Resolve which category and amount apply after the update
    // (uses the new value if provided, else keeps the current)
    const effectiveCategoryId = data.categoryId ?? reimbursement.categoryId;
    const effectiveAmount = data.amount ?? reimbursement.amount;

    if (data.categoryId || data.amount !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: effectiveCategoryId },
      });
      if (!category || !category.isActive) {
        throw new Error('Category is invalid or inactive');
      }

      // EXTRA: enforce per-category spending limit on update too
      if (category.maxAmount !== null && effectiveAmount > category.maxAmount) {
        throw new Error(
          `Amount exceeds the limit for category "${category.name}". Maximum allowed: R$ ${category.maxAmount.toFixed(2)}`
        );
      }
    }

    if (data.expenseDate) {
      const expenseDate = dayjs(data.expenseDate);
      if (expenseDate.isAfter(dayjs())) {
        throw new Error('Expense date cannot be in the future');
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reimbursement.update({
        where: { id },
        data: {
          description: data.description,
          amount: data.amount,
          expenseDate: data.expenseDate ? dayjs(data.expenseDate).toDate() : undefined,
          categoryId: data.categoryId,
        },
      });

      await tx.reimbursementHistory.create({
        data: {
          action: 'UPDATED',
          reimbursementId: id,
          authorId: user.id,
          notes: 'Reimbursement details updated',
        },
      });

      return updated;
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
    
    // EXTRA: Bloqueio de solicitação sem anexo acima de determinado valor.
    const ATTACHMENT_REQUIRED_THRESHOLD = 500;
    if (reimbursement.amount > ATTACHMENT_REQUIRED_THRESHOLD) {
      if (!reimbursement.attachments || reimbursement.attachments.length === 0) {
        throw new Error(
          `Reimbursements above R$ ${ATTACHMENT_REQUIRED_THRESHOLD} require at least one attachment`
        );
      }
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

  async addAttachment(id: string, data: z.infer<typeof createAttachmentSchema>, user: { id: string; role: string }) {
    const reimbursement = await this.findById(id, user);

    if (reimbursement.employeeId !== user.id) {
      throw new Error('Only the owner can add attachments to this reimbursement');
    }

    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new Error('Attachments can only be added to DRAFT or SUBMITTED reimbursements');
    }

    return prisma.attachment.create({
      data: {
        fileName: data.fileName,
        url: data.url,
        fileType: data.fileType,
        reimbursementId: id,
      },
    });
  }

  async getAttachments(id: string, user: { id: string; role: string }) {
    await this.findById(id, user); 

    return prisma.attachment.findMany({
      where: { reimbursementId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAttachmentById(
    reimbursementId: string,
    attachmentId: string,
    user: { id: string; role: string }
  ) {
  
    await this.findById(reimbursementId, user);

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    
    if (!attachment || attachment.reimbursementId !== reimbursementId) {
      throw new Error('Attachment not found');
    }

    return attachment;
  }

  async updateAttachment(
    reimbursementId: string,
    attachmentId: string,
    data: z.infer<typeof updateAttachmentSchema>,
    user: { id: string; role: string }
  ) {
    const reimbursement = await this.findById(reimbursementId, user);

    if (reimbursement.employeeId !== user.id) {
      throw new Error('Only the owner can update attachments');
    }

    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new Error('Attachments can only be updated when reimbursement is DRAFT or SUBMITTED');
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.reimbursementId !== reimbursementId) {
      throw new Error('Attachment not found');
    }

    return prisma.attachment.update({
      where: { id: attachmentId },
      data: { fileName: data.fileName },
    });
  }

  async deleteAttachment(
    reimbursementId: string,
    attachmentId: string,
    user: { id: string; role: string }
  ) {
    const reimbursement = await this.findById(reimbursementId, user);

    if (reimbursement.employeeId !== user.id) {
      throw new Error('Only the owner can delete attachments');
    }

    if (reimbursement.status !== 'DRAFT' && reimbursement.status !== 'SUBMITTED') {
      throw new Error('Attachments can only be deleted when reimbursement is DRAFT or SUBMITTED');
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.reimbursementId !== reimbursementId) {
      throw new Error('Attachment not found');
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });
    return { success: true };
  }

  async getHistory(id: string, user: { id: string; role: string }) {
    await this.findById(id, user);

    return prisma.reimbursementHistory.findMany({
      where: { reimbursementId: id },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
