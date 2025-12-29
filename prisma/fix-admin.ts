import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing admin user...');

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@crm.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user exists, updating password...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { email: 'admin@crm.com' },
      data: {
        password: hashedPassword,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log('✅ Admin password updated successfully!');
  } else {
    console.log('⚠️  Admin user not found, creating...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Admin user created successfully!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

