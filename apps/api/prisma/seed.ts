import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample site groups
  const travelGroup = await prisma.siteGroup.upsert({
    where: { name: 'Travel' },
    update: {},
    create: { name: 'Travel' },
  });

  const healthGroup = await prisma.siteGroup.upsert({
    where: { name: 'Health' },
    update: {},
    create: { name: 'Health' },
  });

  const techGroup = await prisma.siteGroup.upsert({
    where: { name: 'Technology' },
    update: {},
    create: { name: 'Technology' },
  });

  console.log('Created site groups:', [travelGroup.name, healthGroup.name, techGroup.name]);

  console.log('Seeding completed!');
  console.log('');
  console.log('Default admin credentials:');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Please change the password after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
