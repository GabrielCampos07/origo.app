import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Origo DEMO users...');

  // Seed user 1: prof@origo.dev
  const prof = await prisma.user.upsert({
    where: { email: 'prof@origo.dev' },
    update: {},
    create: {
      email: 'prof@origo.dev',
      passwordHash: await hashPassword('OrigoDemoProf1!'),
    },
  });
  console.log('✅ Professor user:', prof.email);

  // Seed user 2: aluno@origo.dev
  const aluno = await prisma.user.upsert({
    where: { email: 'aluno@origo.dev' },
    update: {},
    create: {
      email: 'aluno@origo.dev',
      passwordHash: await hashPassword('OrigoDemoAluno1!'),
    },
  });
  console.log('✅ Student user:', aluno.email);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
