import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 8);

  // Users
  const admin = await prisma.user.upsert({  // UPdate + inSERT
    where: { email: 'admin@pitang.com' },
    update: {},
    create: {
      email: 'admin@pitang.com',
      name: 'Admin User',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@pitang.com' },
    update: {},
    create: {
      email: 'employee@pitang.com',
      name: 'Employee User',
      password: passwordHash,
      role: 'EMPLOYEE',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@pitang.com' },
    update: {},
    create: {
      email: 'manager@pitang.com',
      name: 'Manager User',
      password: passwordHash,
      role: 'MANAGER',
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: 'finance@pitang.com' },
    update: {},
    create: {
      email: 'finance@pitang.com',
      name: 'Finance User',
      password: passwordHash,
      role: 'FINANCE',
    },
  });

  console.log('Users created:', { admin: admin.email, employee: employee.email, manager: manager.email, finance: finance.email });


  const categoriesData = [
    { name: 'Food' },
    { name: 'Transport' },
    { name: 'Lodging' },
    { name: 'Office Supplies' },
  ];

  for (const cat of categoriesData) {
    const existingCat = await prisma.category.findFirst({
      where: { name: cat.name },
    });
    if (!existingCat) {
      await prisma.category.create({
        data: cat,
      });
    }
  }

  console.log('Categories created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
