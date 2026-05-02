import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

describe('Reimbursement API Integration Tests', () => {
  let emp1Token: string;
  let emp2Token: string;
  let mgrToken: string;
  let finToken: string;
  let categoryId: string;

  beforeAll(async () => {
    // Limpar banco de teste
    await prisma.attachment.deleteMany();
    await prisma.reimbursementHistory.deleteMany();
    await prisma.reimbursement.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('123456', 10);
    
    // Criar usuários base
    await prisma.user.create({ data: { name: 'Emp 1', email: 'emp1@test.com', password: passwordHash, role: 'EMPLOYEE' } });
    await prisma.user.create({ data: { name: 'Emp 2', email: 'emp2@test.com', password: passwordHash, role: 'EMPLOYEE' } });
    await prisma.user.create({ data: { name: 'Mgr', email: 'mgr@test.com', password: passwordHash, role: 'MANAGER' } });
    await prisma.user.create({ data: { name: 'Fin', email: 'fin@test.com', password: passwordHash, role: 'FINANCE' } });

    // Criar categoria base
    const category = await prisma.category.create({ data: { name: 'Viagem', isActive: true } });
    categoryId = category.id;

    // Fazer login e coletar tokens em paralelo para agilizar
    const [emp1Login, emp2Login, mgrLogin, finLogin] = await Promise.all([
      request(app).post('/auth/login').send({ email: 'emp1@test.com', password: '123456' }),
      request(app).post('/auth/login').send({ email: 'emp2@test.com', password: '123456' }),
      request(app).post('/auth/login').send({ email: 'mgr@test.com', password: '123456' }),
      request(app).post('/auth/login').send({ email: 'fin@test.com', password: '123456' })
    ]);

    emp1Token = emp1Login.body.token;
    emp2Token = emp2Login.body.token;
    mgrToken = mgrLogin.body.token;
    finToken = finLogin.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Função auxiliar para criar reembolsos em massa/independentes para cada teste
  async function createReimbursement(token: string) {
    const res = await request(app)
      .post('/reimbursements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Test expense',
        amount: 100,
        expenseDate: new Date().toISOString(),
        categoryId: categoryId,
      });
    return res.body;
  }

  describe('Authentication', () => {
    it('should block unauthenticated access', async () => {
      const response = await request(app).get('/reimbursements');
      expect(response.status).toBe(401);
    });
  });

  describe('Input Validations', () => {
    it('should return 400 when creating with missing fields', async () => {
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({ amount: 100 }); // Faltando description, date, category
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when amount is negative', async () => {
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({
          description: 'Valid desc',  
          amount: -50,
          expenseDate: new Date().toISOString(),
          categoryId: categoryId,
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('greater than zero') })
      ]));
    });
  });

  describe('User Isolation (RBAC)', () => {
    it('should block EMPLOYEE from seeing another employee reimbursement', async () => {
      const rmb = await createReimbursement(emp1Token);
      
      // O EMPLOYEE 2 tenta acessar o reembolso criado pelo EMPLOYEE 1
      const response = await request(app)
        .get(`/reimbursements/${rmb.id}`)
        .set('Authorization', `Bearer ${emp2Token}`);
        
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Unauthorized access');
    });

    it('should block EMPLOYEE from approving', async () => {
      const rmb = await createReimbursement(emp1Token);
      await request(app).post(`/reimbursements/${rmb.id}/submit`).set('Authorization', `Bearer ${emp1Token}`);

      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/approve`)
        .set('Authorization', `Bearer ${emp1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only MANAGER');
    });
  });

  describe('Cancellation Flow', () => {
    it('should allow EMPLOYEE to cancel a DRAFT reimbursement', async () => {
      const rmb = await createReimbursement(emp1Token);
      
      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/cancel`)
        .set('Authorization', `Bearer ${emp1Token}`);
        
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELED');
    });

    it('should block MANAGER from canceling', async () => {
      const rmb = await createReimbursement(emp1Token);
      
      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/cancel`)
        .set('Authorization', `Bearer ${mgrToken}`);
        
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only EMPLOYEE');
    });
  });

  describe('Rejection Flow', () => {
    it('should allow MANAGER to reject a SUBMITTED reimbursement', async () => {
      const rmb = await createReimbursement(emp1Token);
      await request(app).post(`/reimbursements/${rmb.id}/submit`).set('Authorization', `Bearer ${emp1Token}`);
      
      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/reject`)
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({ reason: 'Valor acima da política' });
        
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('REJECTED');
      expect(response.body.rejectionReason).toBe('Valor acima da política');
    });

    it('should block rejecting without a reason', async () => {
      const rmb = await createReimbursement(emp1Token);
      await request(app).post(`/reimbursements/${rmb.id}/submit`).set('Authorization', `Bearer ${emp1Token}`);
      
      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/reject`)
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({}); // Faltando o campo reason
        
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Happy Path: Submit -> Approve -> Pay', () => {
    it('should execute the full state machine successfully', async () => {
      // 1. Criar DRAFT
      const rmb = await createReimbursement(emp1Token);
      expect(rmb.status).toBe('DRAFT');

      // 2. Submeter
      const submitRes = await request(app).post(`/reimbursements/${rmb.id}/submit`).set('Authorization', `Bearer ${emp1Token}`);
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.status).toBe('SUBMITTED');

      // 3. Aprovar
      const approveRes = await request(app).post(`/reimbursements/${rmb.id}/approve`).set('Authorization', `Bearer ${mgrToken}`);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('APPROVED');

      // 4. Pagar
      const payRes = await request(app).post(`/reimbursements/${rmb.id}/pay`).set('Authorization', `Bearer ${finToken}`);
      expect(payRes.status).toBe(200);
      expect(payRes.body.status).toBe('PAID');
    });
  });

  describe('Attachments & History', () => {
    it('should allow EMPLOYEE to add an attachment', async () => {
      const rmb = await createReimbursement(emp1Token);
      
      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/attachments`)
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({
          fileName: 'nota_fiscal.pdf',
          url: 'https://exemplo.com/nota_fiscal.pdf',
          fileType: 'PDF'
        });
        
      expect(response.status).toBe(201);
      expect(response.body.fileName).toBe('nota_fiscal.pdf');
    });

    it('should return 400 when attachment has invalid fileType', async () => {
      const rmb = await createReimbursement(emp1Token);

      const response = await request(app)
        .post(`/reimbursements/${rmb.id}/attachments`)
        .set('Authorization', `Bearer ${emp1Token}`)
        .send({
          fileName: 'virus.exe',
          url: 'https://exemplo.com/virus.exe',
          fileType: 'EXE'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return history of a reimbursement', async () => {
      const rmb = await createReimbursement(emp1Token);
      await request(app).post(`/reimbursements/${rmb.id}/submit`).set('Authorization', `Bearer ${emp1Token}`);
      
      const response = await request(app)
        .get(`/reimbursements/${rmb.id}/history`)
        .set('Authorization', `Bearer ${emp1Token}`);
        
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // DRAFT CREATED, SUBMITTED
      expect(response.body[0].action).toBe('SUBMITTED'); // Ordem decrescente
    });
  });
});
