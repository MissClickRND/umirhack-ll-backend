const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: pool });

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'SuperPassword123';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log('Seed complete. Admin user is ready:', admin);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
