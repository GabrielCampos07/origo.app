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
  // Always refresh passwordHash so local/demo credentials stay click-testable after re-seed.
  const profPasswordHash = await hashPassword('OrigoDemoProf1!');
  const prof = await prisma.user.upsert({
    where: { email: 'prof@origo.dev' },
    update: { 
      role: 'PROFESSIONAL',
      name: 'Dr. João Silva',
      passwordHash: profPasswordHash,
      subscriptionActive: true, // SECURITY SOFT 2: Demo users need active subscription for smoke tests
    },
    create: {
      email: 'prof@origo.dev',
      passwordHash: profPasswordHash,
      name: 'Dr. João Silva',
      role: 'PROFESSIONAL',
      subscriptionActive: true, // SECURITY SOFT 2: Demo users need active subscription for smoke tests
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
    update: {
      usedAt: null,
      professionalUserId: prof.id,
      category: 'FISIOTERAPIA',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
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
  // Always refresh passwordHash so local/demo credentials stay click-testable after re-seed.
  const alunoPasswordHash = await hashPassword('OrigoDemoAluno1!');
  const aluno = await prisma.user.upsert({
    where: { email: 'aluno@origo.dev' },
    update: { 
      role: 'STUDENT',
      name: 'Maria Santos',
      passwordHash: alunoPasswordHash,
    },
    create: {
      email: 'aluno@origo.dev',
      passwordHash: alunoPasswordHash,
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

  const enrollment = existingEnrollment ?? await prisma.enrollment.create({
    data: {
      studentUserId: aluno.id,
      professionalUserId: prof.id,
      category: 'FISIOTERAPIA',
      status: 'ACTIVE',
    },
  });
  if (!existingEnrollment) {
    console.log('✅ Enrollment created:', aluno.email, '→', prof.email, '(FISIOTERAPIA)');
  } else {
    console.log('✅ Enrollment already exists:', aluno.email, '→', prof.email, '(FISIOTERAPIA)');
  }

  const profDocs = [
    'privacy_v2_2026-09-13',
    'terms_app_v2_2026-09-13',
    'terms_saas_v2_2026-09-13',
    'payments_notice_v2_2026-09-13',
  ];
  const studentDocs = ['privacy_v2_2026-09-13', 'terms_app_v2_2026-09-13'];

  await prisma.legalAcceptance.createMany({
    data: [
      ...profDocs.map((docVersion) => ({ userId: prof.id, docVersion })),
      ...studentDocs.map((docVersion) => ({ userId: aluno.id, docVersion })),
    ],
    skipDuplicates: true,
  });
  console.log('✅ Legal acceptances recorded for demo users');

  let program = await prisma.program.findFirst({
    where: { enrollmentId: enrollment.id, status: 'ACTIVE' },
    include: { exercises: true, sessions: true },
  });

  if (!program) {
    program = await prisma.program.create({
      data: {
        enrollmentId: enrollment.id,
        title: 'Reabilitação joelho — fase 2',
        phaseLabel: 'Fortalecimento',
        targetSessionsPerWeek: 3,
        exercises: {
          create: [
            {
              orderIndex: 0,
              name: 'Ponte glútea',
              sets: 3,
              reps: '12',
              notes: 'Elevar o quadril sem arquear a lombar',
              precautions: 'Parar se houver dor aguda no joelho',
            },
            {
              orderIndex: 1,
              name: 'Agachamento à parede',
              sets: 3,
              reps: '10',
              notes: 'Descer até 45°, joelho alinhado com o pé',
              precautions: 'Não ultrapassar a ponta dos pés',
            },
            {
              orderIndex: 2,
              name: 'Alongamento de isquiotibiais',
              sets: 3,
              reps: '30s',
              notes: 'Manter a coluna neutra',
              precautions: null,
            },
            {
              orderIndex: 3,
              name: 'Mobilidade de tornozelo',
              sets: 2,
              reps: '15',
              notes: 'Movimento lento e controlado',
              precautions: null,
            },
          ],
        },
      },
      include: { exercises: true, sessions: true },
    });
    console.log('✅ Demo program created:', program.title);
  } else {
    console.log('✅ Demo program already exists:', program.title);
  }

  const visibleExercises = program.exercises
    .filter((exercise) => exercise.removedAt === null)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const completedCount = await prisma.workoutSession.count({
    where: { programId: program.id, status: 'COMPLETED' },
  });

  if (completedCount === 0 && visibleExercises.length > 0) {
    const now = new Date();
    const startOfWeek = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const weekday = startOfWeek.getUTCDay();
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));

    const thisWeekEarly = new Date(Math.max(startOfWeek.getTime() + 60 * 60 * 1000, now.getTime() - 2 * 60 * 60 * 1000));
    const thisWeekLatest = now;
    const lastWeek = new Date(startOfWeek.getTime() - 2 * 24 * 60 * 60 * 1000);

    const sessionSpecs = [
      { completedAt: lastWeek, painLevel: 5 },
      { completedAt: thisWeekEarly, painLevel: 3 },
      { completedAt: thisWeekLatest, painLevel: 4 },
    ];

    for (const spec of sessionSpecs) {
      const session = await prisma.workoutSession.create({
        data: {
          programId: program.id,
          studentId: aluno.id,
          status: 'COMPLETED',
          startedAt: new Date(spec.completedAt.getTime() - 40 * 60 * 1000),
          completedAt: spec.completedAt,
          painLevel: spec.painLevel,
        },
      });

      await prisma.sessionExerciseLog.createMany({
        data: visibleExercises.map((exercise) => ({
          sessionId: session.id,
          programExerciseId: exercise.id,
          setsCompleted: exercise.sets,
          completedAt: spec.completedAt,
        })),
      });
    }

    console.log('✅ Demo sessions: 2 completed this week + 1 last week (adesão 67% com meta 3)');
  } else {
    console.log('✅ Demo sessions already present');
  }

  const existingNote = await prisma.clinicalNote.findFirst({
    where: { studentId: aluno.id, professionalId: prof.id },
  });
  if (!existingNote) {
    await prisma.clinicalNote.create({
      data: {
        studentId: aluno.id,
        professionalId: prof.id,
        conduta: 'Manter HEP de fortalecimento 3x/semana. Progressão de carga na ponte glútea se VAS ≤ 3.',
        evolucao: 'Relata menos dor ao subir escadas. Adesão boa nas duas sessões desta semana.',
        informacoesPertinentes: 'Sem edema. Sem bloqueio articular. Orientada a interromper se dor aguda.',
      },
    });
    console.log('✅ Demo clinical note created');
  } else {
    console.log('✅ Demo clinical note already exists');
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
