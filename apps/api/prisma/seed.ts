import { PrismaClient } from '@prisma/client';
import { hashPassword, hashToken } from '../src/lib/crypto';

const prisma = new PrismaClient();

// Demo invite token constant (only used in seed for demo purposes)
// In production, tokens are generated dynamically via generateSecureToken()
// ⚠️  PRODUCTION NEVER LOGS TOKENS — this log is dev/demo only
const DEMO_INVITE_TOKEN = 'demo-invite-token-origo-fisio-2026';

async function main() {
  console.log('🌱 Seeding Origo DEMO users...');

  // Seed user 1: prof@origo.dev (PROFESSIONAL with name and profile)
  const prof = await prisma.user.upsert({
    where: { email: 'prof@origo.dev' },
    update: { 
      role: 'PROFESSIONAL',
      name: 'Dr. João Silva',
    },
    create: {
      email: 'prof@origo.dev',
      passwordHash: await hashPassword('OrigoDemoProf1!'),
      name: 'Dr. João Silva',
      role: 'PROFESSIONAL',
    },
  });
  console.log('✅ Professor user:', prof.email, '- Name:', prof.name);

  // Seed professional profile for prof@origo.dev
  const profProfile = await prisma.professionalProfile.upsert({
    where: { userId: prof.id },
    update: { category: 'FISIOTERAPIA' },
    create: {
      userId: prof.id,
      category: 'FISIOTERAPIA',
    },
  });
  console.log('✅ Professional profile:', profProfile.category, 'for', prof.email);

  // Seed demo invite token (hash the stable demo token for idempotent upsert)
  const demoTokenHash = hashToken(DEMO_INVITE_TOKEN);
  const demoInviteToken = await prisma.inviteToken.upsert({
    where: { tokenHash: demoTokenHash },
    update: {},
    create: {
      tokenHash: demoTokenHash,
      professionalUserId: prof.id,
      category: 'FISIOTERAPIA',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });
  console.log('✅ Demo invite token created (idempotent, never expires in demo)');
  console.log('   Plaintext token (DEMO ONLY - prod never logs):', DEMO_INVITE_TOKEN);
  console.log('   Token hash (first 16 chars):', demoInviteToken.tokenHash.substring(0, 16) + '...');

  // Seed user 2: aluno@origo.dev (STUDENT with name and enrollment)
  const aluno = await prisma.user.upsert({
    where: { email: 'aluno@origo.dev' },
    update: { 
      role: 'STUDENT',
      name: 'Maria Santos',
    },
    create: {
      email: 'aluno@origo.dev',
      passwordHash: await hashPassword('OrigoDemoAluno1!'),
      name: 'Maria Santos',
      role: 'STUDENT',
    },
  });
  console.log('✅ Student user:', aluno.email, '- Name:', aluno.name);

  // Seed enrollment (aluno enrolled with prof in FISIOTERAPIA)
  // First check if active enrollment already exists to maintain idempotency
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentUserId: aluno.id,
      professionalUserId: prof.id,
      category: 'FISIOTERAPIA',
      status: 'ACTIVE',
    },
  });

  if (!existingEnrollment) {
    const enrollment = await prisma.enrollment.create({
      data: {
        studentUserId: aluno.id,
        professionalUserId: prof.id,
        category: 'FISIOTERAPIA',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Enrollment created:', aluno.email, '→', prof.email, '(FISIOTERAPIA)');
  } else {
    console.log('✅ Enrollment already exists:', aluno.email, '→', prof.email, '(FISIOTERAPIA)');
  }

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
