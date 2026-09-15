import { PrismaClient } from '@prisma/client';
import { hashPassword, hashToken } from '../src/lib/crypto';

const prisma = new PrismaClient();

// Demo invite token constant (only used in seed for demo purposes)
// In production, tokens are generated dynamically via generateSecureToken()
// ⚠️  PRODUCTION NEVER LOGS TOKENS — this log is dev/demo only
const DEMO_INVITE_TOKEN = 'demo-invite-token-origo-fisio-2026';

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
] as const;

type CatalogSeed = {
  slug: string;
  namePt: string;
  categoryTags: string[];
  cuesPt: string;
  durationSec: number;
};

const CATALOG_SEEDS: CatalogSeed[] = [
  // Demo fisio names (exact match for linking)
  { slug: 'ponte-glutea', namePt: 'Ponte glútea', categoryTags: ['gluteo', 'core', 'joelho'], cuesPt: 'Elevar o quadril sem arquear a lombar', durationSec: 45 },
  { slug: 'agachamento-parede', namePt: 'Agachamento à parede', categoryTags: ['quadriceps', 'joelho'], cuesPt: 'Descer até 45°, joelho alinhado com o pé', durationSec: 50 },
  { slug: 'alongamento-isquiotibiais', namePt: 'Alongamento de isquiotibiais', categoryTags: ['alongamento', 'posterior'], cuesPt: 'Manter a coluna neutra', durationSec: 40 },
  { slug: 'mobilidade-tornozelo', namePt: 'Mobilidade de tornozelo', categoryTags: ['mobilidade', 'tornozelo'], cuesPt: 'Movimento lento e controlado', durationSec: 35 },
  // Demo EF names
  { slug: 'agachamento-livre', namePt: 'Agachamento livre', categoryTags: ['forca', 'membros-inferiores'], cuesPt: 'Descer controlado, joelhos alinhados', durationSec: 55 },
  { slug: 'flexao-braco', namePt: 'Flexão de braço', categoryTags: ['empurrar', 'peito'], cuesPt: 'Core estável, amplitude confortável', durationSec: 40 },
  { slug: 'prancha-isometrica', namePt: 'Prancha isométrica', categoryTags: ['core', 'isometria'], cuesPt: 'Manter alinhamento ombro-quadril-tornozelo', durationSec: 45 },
  // Extra fisio / rehab catalog
  { slug: 'elevacao-perna-reta', namePt: 'Elevação de perna reta', categoryTags: ['quadriceps', 'joelho'], cuesPt: 'Contrair o quadríceps antes de elevar', durationSec: 40 },
  { slug: 'abducao-quadril-deitado', namePt: 'Abdução de quadril deitado', categoryTags: ['gluteo', 'quadril'], cuesPt: 'Não rodar o tronco', durationSec: 40 },
  { slug: 'clam-shell', namePt: 'Clam shell', categoryTags: ['gluteo', 'quadril'], cuesPt: 'Manter o tronco estável', durationSec: 35 },
  { slug: 'step-up', namePt: 'Step-up', categoryTags: ['forca', 'joelho'], cuesPt: 'Empurrar pelo calcanhar da perna de apoio', durationSec: 45 },
  { slug: 'mini-agachamento', namePt: 'Mini agachamento', categoryTags: ['quadriceps', 'joelho'], cuesPt: 'Amplitude confortável sem dor', durationSec: 40 },
  { slug: 'sentar-levantar', namePt: 'Sentar e levantar', categoryTags: ['funcional', 'quadriceps'], cuesPt: 'Controle na descida', durationSec: 40 },
  { slug: 'marcha-estacionaria', namePt: 'Marcha estacionária', categoryTags: ['cardio', 'funcional'], cuesPt: 'Postura ereta, ritmo confortável', durationSec: 30 },
  { slug: 'alongamento-panturrilha', namePt: 'Alongamento de panturrilha', categoryTags: ['alongamento', 'tornozelo'], cuesPt: 'Calcanhar no chão, joelho estendido', durationSec: 35 },
  { slug: 'alongamento-quadriceps', namePt: 'Alongamento de quadríceps', categoryTags: ['alongamento', 'quadriceps'], cuesPt: 'Aproximar o calcanhar sem arquear a lombar', durationSec: 35 },
  { slug: 'mobilidade-toracica', namePt: 'Mobilidade torácica', categoryTags: ['mobilidade', 'coluna'], cuesPt: 'Respirar e girar sem forçar a lombar', durationSec: 40 },
  { slug: 'cat-camel', namePt: 'Gato-camelo', categoryTags: ['mobilidade', 'coluna'], cuesPt: 'Movimento lento e fluido', durationSec: 35 },
  { slug: 'bird-dog', namePt: 'Bird dog', categoryTags: ['core', 'controle'], cuesPt: 'Estender opostos sem rotacionar a pelve', durationSec: 45 },
  { slug: 'dead-bug', namePt: 'Dead bug', categoryTags: ['core', 'controle'], cuesPt: 'Lombar estável no chão', durationSec: 45 },
  { slug: 'ponte-unilateral', namePt: 'Ponte unilateral', categoryTags: ['gluteo', 'core'], cuesPt: 'Quadril nivelado', durationSec: 45 },
  { slug: 'wall-slide', namePt: 'Wall slide', categoryTags: ['ombro', 'mobilidade'], cuesPt: 'Costas e braços em contato leve com a parede', durationSec: 40 },
  { slug: 'rotacao-externa-ombro', namePt: 'Rotação externa de ombro', categoryTags: ['ombro', 'manguito'], cuesPt: 'Cotovelo junto ao tronco', durationSec: 35 },
  { slug: 'serratus-wall-punch', namePt: 'Serratus wall punch', categoryTags: ['ombro', 'escapula'], cuesPt: 'Protrair a escápula sem elevar o ombro', durationSec: 35 },
  { slug: 'isometria-joelho', namePt: 'Isometria de joelho', categoryTags: ['joelho', 'isometria'], cuesPt: 'Contrair o quadríceps e segurar', durationSec: 30 },
  { slug: 'equilibrio-unipodal', namePt: 'Equilíbrio unipodal', categoryTags: ['equilibrio', 'propriocepcao'], cuesPt: 'Olhar fixo; progressão com olhos fechados', durationSec: 40 },
  { slug: 'flexao-plantar', namePt: 'Flexão plantar em pé', categoryTags: ['panturrilha', 'tornozelo'], cuesPt: 'Subir nos dedos com controle', durationSec: 35 },
  { slug: 'ponte-com-bola', namePt: 'Ponte com bola', categoryTags: ['gluteo', 'core'], cuesPt: 'Pressione a bola suavemente', durationSec: 45 },
  // Extra EF / conditioning
  { slug: 'afundo-estatico', namePt: 'Afundo estático', categoryTags: ['forca', 'membros-inferiores'], cuesPt: 'Joelho da frente alinhado ao pé', durationSec: 45 },
  { slug: 'remada-invertida', namePt: 'Remada invertida', categoryTags: ['puxar', 'costas'], cuesPt: 'Corpo rígido como prancha', durationSec: 40 },
  { slug: 'desenvolvimento-ombro', namePt: 'Desenvolvimento de ombro', categoryTags: ['empurrar', 'ombro'], cuesPt: 'Não arquear a lombar', durationSec: 40 },
  { slug: 'rosca-biceps', namePt: 'Rosca bíceps', categoryTags: ['bracos', 'forca'], cuesPt: 'Cotovelos estáveis', durationSec: 30 },
  { slug: 'triceps-no-banco', namePt: 'Tríceps no banco', categoryTags: ['bracos', 'empurrar'], cuesPt: 'Cotovelos para trás, não para os lados', durationSec: 35 },
  { slug: 'elevacao-panturrilha', namePt: 'Elevação de panturrilha', categoryTags: ['panturrilha', 'forca'], cuesPt: 'Amplitude completa e controle', durationSec: 30 },
  { slug: 'jumping-jack', namePt: 'Jumping jack', categoryTags: ['cardio', 'aquecimento'], cuesPt: 'Aterrissagem suave', durationSec: 25 },
  { slug: 'mountain-climber', namePt: 'Mountain climber', categoryTags: ['cardio', 'core'], cuesPt: 'Quadril estável', durationSec: 30 },
  { slug: 'burpee-modificado', namePt: 'Burpee modificado', categoryTags: ['cardio', 'condicioamento'], cuesPt: 'Sem salto se houver dor', durationSec: 40 },
  { slug: 'swing-kettlebell', namePt: 'Swing de kettlebell', categoryTags: ['hinge', 'potencia'], cuesPt: 'Empurrar o quadril, não puxar com os braços', durationSec: 40 },
  { slug: 'farmers-carry', namePt: 'Farmers carry', categoryTags: ['core', 'grip'], cuesPt: 'Ombros baixos, passos curtos', durationSec: 35 },
  { slug: 'hip-thrust', namePt: 'Hip thrust', categoryTags: ['gluteo', 'forca'], cuesPt: 'Queixo neutro, empurrar o quadril', durationSec: 45 },
  { slug: 'good-morning', namePt: 'Good morning', categoryTags: ['hinge', 'posterior'], cuesPt: 'Joelhos levemente flexionados', durationSec: 40 },
  { slug: 'side-plank', namePt: 'Prancha lateral', categoryTags: ['core', 'isometria'], cuesPt: 'Corpo em linha reta', durationSec: 35 },
  { slug: 'glute-bridge-march', namePt: 'Marcha em ponte', categoryTags: ['gluteo', 'core'], cuesPt: 'Quadril alto e estável', durationSec: 40 },
  { slug: 'calf-stretch-wall', namePt: 'Alongamento de panturrilha na parede', categoryTags: ['alongamento', 'tornozelo'], cuesPt: 'Calcanhar colado ao solo', durationSec: 30 },
  { slug: 'thoracic-extension', namePt: 'Extensão torácica no rolo', categoryTags: ['mobilidade', 'coluna'], cuesPt: 'Abrir o peito sem hiperextender a lombar', durationSec: 35 },
  { slug: 'scapular-retraction', namePt: 'Retração escapular', categoryTags: ['escapula', 'postura'], cuesPt: 'Aproximar as escápulas sem elevar ombros', durationSec: 30 },
  { slug: 'ankle-circles', namePt: 'Círculos de tornozelo', categoryTags: ['mobilidade', 'tornozelo'], cuesPt: 'Amplitude confortável nos dois sentidos', durationSec: 25 },
  { slug: 'hamstring-curl', namePt: 'Flexão de joelho em deitado', categoryTags: ['isquiotibiais', 'forca'], cuesPt: 'Movimento controlado', durationSec: 35 },
  { slug: 'sit-to-stand-tempo', namePt: 'Sentar-levantar com tempo', categoryTags: ['funcional', 'controle'], cuesPt: '3 segundos na descida', durationSec: 40 },
  { slug: 'single-leg-rdl', namePt: 'RDL unilateral', categoryTags: ['hinge', 'equilibrio'], cuesPt: 'Quadril para trás, tronco longo', durationSec: 45 },
];

async function seedExerciseCatalog() {
  let index = 0;
  for (const item of CATALOG_SEEDS) {
    const videoUrl = SAMPLE_VIDEOS[index % SAMPLE_VIDEOS.length];
    index += 1;
    await prisma.exerciseCatalogItem.upsert({
      where: { slug: item.slug },
      update: {
        namePt: item.namePt,
        categoryTags: item.categoryTags,
        videoUrl,
        cuesPt: item.cuesPt,
        durationSec: item.durationSec,
        active: true,
      },
      create: {
        slug: item.slug,
        namePt: item.namePt,
        categoryTags: item.categoryTags,
        videoUrl,
        cuesPt: item.cuesPt,
        durationSec: item.durationSec,
        active: true,
      },
    });
  }
  console.log(`✅ Exercise catalog seeded (${CATALOG_SEEDS.length} items)`);
}

async function linkExercisesToCatalog(programId: string) {
  const exercises = await prisma.programExercise.findMany({
    where: { programId, removedAt: null },
  });
  for (const exercise of exercises) {
    if (exercise.catalogItemId) continue;
    const match = await prisma.exerciseCatalogItem.findFirst({
      where: { namePt: exercise.name, active: true },
    });
    if (match) {
      await prisma.programExercise.update({
        where: { id: exercise.id },
        data: { catalogItemId: match.id },
      });
    }
  }
}

async function main() {
  console.log('🌱 Seeding Origo DEMO users...');

  await seedExerciseCatalog();

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

  const catalogByName = new Map(
    (await prisma.exerciseCatalogItem.findMany({ where: { active: true } })).map((item) => [
      item.namePt,
      item.id,
    ])
  );

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
              notes: null,
              precautions: 'Parar se houver dor aguda no joelho',
              catalogItemId: catalogByName.get('Ponte glútea') ?? null,
            },
            {
              orderIndex: 1,
              name: 'Agachamento à parede',
              sets: 3,
              reps: '10',
              notes: null,
              precautions: 'Não ultrapassar a ponta dos pés',
              catalogItemId: catalogByName.get('Agachamento à parede') ?? null,
            },
            {
              orderIndex: 2,
              name: 'Alongamento de isquiotibiais',
              sets: 3,
              reps: '30s',
              notes: null,
              precautions: null,
              catalogItemId: catalogByName.get('Alongamento de isquiotibiais') ?? null,
            },
            {
              orderIndex: 3,
              name: 'Mobilidade de tornozelo',
              sets: 2,
              reps: '15',
              notes: null,
              precautions: null,
              catalogItemId: catalogByName.get('Mobilidade de tornozelo') ?? null,
            },
          ],
        },
      },
      include: { exercises: true, sessions: true },
    });
    console.log('✅ Demo program created:', program.title);
  } else {
    console.log('✅ Demo program already exists:', program.title);
    await linkExercisesToCatalog(program.id);
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
      { completedAt: lastWeek, painLevel: 5, patientNote: 'Dor ao subir escadas no fim do dia.' },
      { completedAt: thisWeekEarly, painLevel: 3, patientNote: null as string | null },
      { completedAt: thisWeekLatest, painLevel: 4, patientNote: 'Mais fácil que ontem; leve cansaço na panturrilha.' },
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
          patientNote: spec.patientNote,
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

  // ── EDUCACAO_FISICA pair: educador@origo.dev + aluno.educador@origo.dev ──
  const educadorPasswordHash = await hashPassword('OrigoDemoEducador1!');
  const educador = await prisma.user.upsert({
    where: { email: 'educador@origo.dev' },
    update: {
      role: 'PROFESSIONAL',
      name: 'Prof. Carlos Mendes',
      passwordHash: educadorPasswordHash,
      subscriptionActive: true,
    },
    create: {
      email: 'educador@origo.dev',
      passwordHash: educadorPasswordHash,
      name: 'Prof. Carlos Mendes',
      role: 'PROFESSIONAL',
      subscriptionActive: true,
    },
  });
  console.log('✅ Educator user:', educador.email, '- Name:', educador.name);

  const educadorProfile = await prisma.professionalProfile.upsert({
    where: { userId: educador.id },
    update: { category: 'EDUCACAO_FISICA' },
    create: {
      userId: educador.id,
      category: 'EDUCACAO_FISICA',
    },
  });
  console.log('✅ Professional profile:', educadorProfile.category, 'for', educador.email);

  const alunoEducadorPasswordHash = await hashPassword('OrigoDemoAlunoEducador1!');
  const alunoEducador = await prisma.user.upsert({
    where: { email: 'aluno.educador@origo.dev' },
    update: {
      role: 'STUDENT',
      name: 'Pedro Oliveira',
      passwordHash: alunoEducadorPasswordHash,
    },
    create: {
      email: 'aluno.educador@origo.dev',
      passwordHash: alunoEducadorPasswordHash,
      name: 'Pedro Oliveira',
      role: 'STUDENT',
    },
  });
  console.log('✅ Educator student:', alunoEducador.email, '- Name:', alunoEducador.name);

  const existingEfEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentUserId: alunoEducador.id,
      professionalUserId: educador.id,
      category: 'EDUCACAO_FISICA',
      status: 'ACTIVE',
    },
  });

  const efEnrollment =
    existingEfEnrollment ??
    (await prisma.enrollment.create({
      data: {
        studentUserId: alunoEducador.id,
        professionalUserId: educador.id,
        category: 'EDUCACAO_FISICA',
        status: 'ACTIVE',
      },
    }));
  if (!existingEfEnrollment) {
    console.log('✅ Enrollment created:', alunoEducador.email, '→', educador.email, '(EDUCACAO_FISICA)');
  } else {
    console.log('✅ Enrollment already exists:', alunoEducador.email, '→', educador.email, '(EDUCACAO_FISICA)');
  }

  await prisma.legalAcceptance.createMany({
    data: [
      ...profDocs.map((docVersion) => ({ userId: educador.id, docVersion })),
      ...studentDocs.map((docVersion) => ({ userId: alunoEducador.id, docVersion })),
    ],
    skipDuplicates: true,
  });
  console.log('✅ Legal acceptances recorded for educator pair');

  let efProgram = await prisma.program.findFirst({
    where: { enrollmentId: efEnrollment.id, status: 'ACTIVE' },
    include: { exercises: true },
  });

  if (!efProgram) {
    efProgram = await prisma.program.create({
      data: {
        enrollmentId: efEnrollment.id,
        title: 'Condicionamento geral — base',
        phaseLabel: 'Adaptação',
        targetSessionsPerWeek: 3,
        exercises: {
          create: [
            {
              orderIndex: 0,
              name: 'Agachamento livre',
              sets: 3,
              reps: '12',
              notes: 'Descer controlado, joelhos alinhados',
              precautions: 'Parar se houver dor no joelho',
              catalogItemId: catalogByName.get('Agachamento livre') ?? null,
            },
            {
              orderIndex: 1,
              name: 'Flexão de braço',
              sets: 3,
              reps: '10',
              notes: 'Core estável, amplitude confortável',
              precautions: null,
              catalogItemId: catalogByName.get('Flexão de braço') ?? null,
            },
            {
              orderIndex: 2,
              name: 'Prancha isométrica',
              sets: 3,
              reps: '30s',
              notes: 'Manter alinhamento ombro-quadril-tornozelo',
              precautions: null,
              catalogItemId: catalogByName.get('Prancha isométrica') ?? null,
            },
          ],
        },
      },
      include: { exercises: true },
    });
    console.log('✅ Demo EF program created:', efProgram.title);
  } else {
    console.log('✅ Demo EF program already exists:', efProgram.title);
    await linkExercisesToCatalog(efProgram.id);
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
