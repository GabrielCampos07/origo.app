import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/crypto';
import { generateAccessToken } from '../lib/jwt';
import { buildApp } from '../app';

const prisma = new PrismaClient();

const PROF_DOCS = [
  'privacy_v2_2026-09-13',
  'terms_app_v2_2026-09-13',
  'terms_saas_v2_2026-09-13',
  'payments_notice_v2_2026-09-13',
];
const STUDENT_DOCS = ['privacy_v2_2026-09-13', 'terms_app_v2_2026-09-13'];

type App = Awaited<ReturnType<typeof buildApp>>;

function authHeader(userId: string, email: string) {
  return { authorization: `Bearer ${generateAccessToken({ userId, email })}` };
}

describe('Slice 2–3 HEP API', () => {
  let app: App;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let professionalId = '';
  let professionalEmail = '';
  let studentId = '';
  let studentEmail = '';
  let otherProfessionalId = '';
  let otherProfessionalEmail = '';
  let otherStudentId = '';
  let unpaidProfessionalId = '';
  let unpaidProfessionalEmail = '';
  let noLegalProfessionalId = '';
  let noLegalProfessionalEmail = '';
  let programId = '';
  let loggedExerciseId = '';
  let removableExerciseId = '';

  before(async () => {
    app = await buildApp();
    await app.ready();

    const passwordHash = await hashPassword('OrigoHepTestPass1!');

    const professional = await prisma.user.create({
      data: {
        email: `hep-pro-${suffix}@origo.test`,
        passwordHash,
        name: 'Pro HEP',
        role: 'PROFESSIONAL',
        subscriptionActive: true,
        professionalProfile: { create: { category: 'FISIOTERAPIA' } },
        legalAcceptances: { create: PROF_DOCS.map((docVersion) => ({ docVersion })) },
      },
    });
    professionalId = professional.id;
    professionalEmail = professional.email;

    const student = await prisma.user.create({
      data: {
        email: `hep-aluno-${suffix}@origo.test`,
        passwordHash,
        name: 'Aluno HEP',
        role: 'STUDENT',
        legalAcceptances: { create: STUDENT_DOCS.map((docVersion) => ({ docVersion })) },
      },
    });
    studentId = student.id;
    studentEmail = student.email;

    const otherPro = await prisma.user.create({
      data: {
        email: `hep-other-pro-${suffix}@origo.test`,
        passwordHash,
        name: 'Other Pro',
        role: 'PROFESSIONAL',
        subscriptionActive: true,
        professionalProfile: { create: { category: 'FISIOTERAPIA' } },
        legalAcceptances: { create: PROF_DOCS.map((docVersion) => ({ docVersion })) },
      },
    });
    otherProfessionalId = otherPro.id;
    otherProfessionalEmail = otherPro.email;

    const otherStudent = await prisma.user.create({
      data: {
        email: `hep-other-aluno-${suffix}@origo.test`,
        passwordHash,
        name: 'Other Aluno',
        role: 'STUDENT',
        legalAcceptances: { create: STUDENT_DOCS.map((docVersion) => ({ docVersion })) },
      },
    });
    otherStudentId = otherStudent.id;

    const unpaid = await prisma.user.create({
      data: {
        email: `hep-unpaid-${suffix}@origo.test`,
        passwordHash,
        name: 'Unpaid Pro',
        role: 'PROFESSIONAL',
        subscriptionActive: false,
        professionalProfile: { create: { category: 'FISIOTERAPIA' } },
        legalAcceptances: { create: PROF_DOCS.map((docVersion) => ({ docVersion })) },
      },
    });
    unpaidProfessionalId = unpaid.id;
    unpaidProfessionalEmail = unpaid.email;

    const noLegal = await prisma.user.create({
      data: {
        email: `hep-nolegal-${suffix}@origo.test`,
        passwordHash,
        name: 'No Legal Pro',
        role: 'PROFESSIONAL',
        subscriptionActive: true,
        professionalProfile: { create: { category: 'FISIOTERAPIA' } },
      },
    });
    noLegalProfessionalId = noLegal.id;
    noLegalProfessionalEmail = noLegal.email;

    const enrollment = await prisma.enrollment.create({
      data: {
        studentUserId: studentId,
        professionalUserId: professionalId,
        category: 'FISIOTERAPIA',
        status: 'ACTIVE',
      },
    });

    await prisma.enrollment.create({
      data: {
        studentUserId: otherStudentId,
        professionalUserId: otherProfessionalId,
        category: 'FISIOTERAPIA',
        status: 'ACTIVE',
      },
    });

    const program = await prisma.program.create({
      data: {
        enrollmentId: enrollment.id,
        title: 'Programa teste',
        phaseLabel: 'Fase 1',
        targetSessionsPerWeek: 3,
        exercises: {
          create: [
            { orderIndex: 0, name: 'Ponte', sets: 3, reps: '12', notes: null, precautions: null },
            { orderIndex: 1, name: 'Alongamento', sets: 2, reps: '30s', notes: null, precautions: null },
          ],
        },
      },
      include: { exercises: { orderBy: { orderIndex: 'asc' } } },
    });
    programId = program.id;
    loggedExerciseId = program.exercises[0].id;
    removableExerciseId = program.exercises[1].id;

    const completedAt = new Date();
    const session = await prisma.workoutSession.create({
      data: {
        programId,
        studentId,
        status: 'COMPLETED',
        startedAt: new Date(completedAt.getTime() - 30 * 60 * 1000),
        completedAt,
        painLevel: 3,
      },
    });
    await prisma.sessionExerciseLog.create({
      data: {
        sessionId: session.id,
        programExerciseId: loggedExerciseId,
        setsCompleted: 3,
      },
    });
  });

  after(async () => {
    const ids = [
      professionalId,
      studentId,
      otherProfessionalId,
      otherStudentId,
      unpaidProfessionalId,
      noLegalProfessionalId,
    ].filter(Boolean);

    if (ids.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    await app.close();
    await prisma.$disconnect();
  });

  async function inject(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    url: string,
    opts: { userId?: string; email?: string; payload?: Record<string, unknown> } = {}
  ) {
    return app.inject({
      method,
      url,
      headers: {
        ...(opts.userId && opts.email ? authHeader(opts.userId, opts.email) : {}),
        ...(opts.payload ? { 'content-type': 'application/json' } : {}),
      },
      payload: opts.payload,
    });
  }

  it('returns 401 without a token', async () => {
    const res = await inject('GET', '/api/v1/professional/students');
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error, 'Unauthorized');
  });

  it('forbids a student from professional routes', async () => {
    const res = await inject('GET', '/api/v1/professional/students', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(res.statusCode, 403);
    assert.equal(res.json().error, 'Forbidden');
  });

  it('blocks unpaid professionals with payment_required', async () => {
    const res = await inject('GET', '/api/v1/professional/students', {
      userId: unpaidProfessionalId,
      email: unpaidProfessionalEmail,
    });
    assert.equal(res.statusCode, 403);
    assert.equal(res.json().error, 'payment_required');
  });

  it('blocks professionals missing legal docs', async () => {
    const res = await inject('GET', '/api/v1/professional/students', {
      userId: noLegalProfessionalId,
      email: noLegalProfessionalEmail,
    });
    assert.equal(res.statusCode, 403);
    assert.equal(res.json().error, 'legal_acceptance_required');
  });

  it('lists own students with adherence and hides others', async () => {
    const res = await inject('GET', '/api/v1/professional/students', {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.students.length, 1);
    assert.equal(body.students[0].id, studentId);
    assert.equal(body.students[0].completedSessionsThisWeek, 1);
    assert.equal(body.students[0].adherencePercent, 33);
    assert.equal(body.students[0].lastSession.painLevel, 3);
  });

  it('returns 404 for another professional student (IDOR)', async () => {
    const res = await inject('GET', `/api/v1/professional/students/${otherStudentId}`, {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().error, 'Not Found');
  });

  it('returns student detail with active program', async () => {
    const res = await inject('GET', `/api/v1/professional/students/${studentId}`, {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.program.id, programId);
    assert.equal(body.program.exercises.length, 2);
    assert.equal(body.adherencePercent, 33);
  });

  it('returns dashboard aggregates', async () => {
    const res = await inject('GET', '/api/v1/professional/dashboard', {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.activeStudents, 1);
    assert.equal(body.sessionsCompletedThisWeek, 1);
    assert.equal(body.averageAdherencePercent, 33);
    assert.equal(body.studentsBelowAdherence, 1);
  });

  it('lets the student read program + today summary', async () => {
    const programRes = await inject('GET', '/api/v1/me/program', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(programRes.statusCode, 200);
    const programBody = programRes.json();
    assert.equal(programBody.program.id, programId);
    assert.equal(programBody.today.adherencePercent, 33);
    assert.equal(programBody.today.completedSessionsThisWeek, 1);

    const todayRes = await inject('GET', '/api/v1/me/today-summary', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(todayRes.statusCode, 200);
    assert.equal(todayRes.json().today.programTitle, 'Programa teste');
  });

  it('forbids a professional from student /me routes', async () => {
    const res = await inject('GET', '/api/v1/me/program', {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(res.statusCode, 403);
  });

  it('starts, logs an exercise, and completes a session with VAS', async () => {
    const start = await inject('POST', '/api/v1/me/sessions', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(start.statusCode, 200);
    const startBody = start.json();
    assert.equal(startBody.session.status, 'IN_PROGRESS');
    assert.equal(startBody.resumed, false);

    const resume = await inject('POST', '/api/v1/me/sessions', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(resume.statusCode, 200);
    assert.equal(resume.json().resumed, true);
    assert.equal(resume.json().session.id, startBody.session.id);

    const completeEx = await inject(
      'POST',
      `/api/v1/me/sessions/${startBody.session.id}/exercises/${loggedExerciseId}/complete`,
      { userId: studentId, email: studentEmail, payload: { setsCompleted: 2 } }
    );
    assert.equal(completeEx.statusCode, 200);
    assert.equal(completeEx.json().log.setsCompleted, 2);

    const completeSession = await inject(
      'POST',
      `/api/v1/me/sessions/${startBody.session.id}/complete`,
      {
        userId: studentId,
        email: studentEmail,
        payload: { painLevel: 2, patientNote: '  Leve dor no final  ' },
      }
    );
    assert.equal(completeSession.statusCode, 200);
    assert.equal(completeSession.json().session.status, 'COMPLETED');
    assert.equal(completeSession.json().session.painLevel, 2);
    assert.equal(completeSession.json().session.patientNote, 'Leve dor no final');
  });

  it('rejects oversized patientNote on complete', async () => {
    const start = await inject('POST', '/api/v1/me/sessions', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(start.statusCode, 200);
    const sessionId = start.json().session.id;

    const res = await inject('POST', `/api/v1/me/sessions/${sessionId}/complete`, {
      userId: studentId,
      email: studentEmail,
      payload: { patientNote: 'x'.repeat(2001) },
    });
    assert.equal(res.statusCode, 422);
  });

  it('returns catalog search for paid professionals', async () => {
    await prisma.exerciseCatalogItem.upsert({
      where: { slug: `hep-test-ponte-${suffix}` },
      update: {
        namePt: 'Ponte teste catálogo',
        categoryTags: ['gluteo', 'teste'],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        active: true,
      },
      create: {
        slug: `hep-test-ponte-${suffix}`,
        namePt: 'Ponte teste catálogo',
        categoryTags: ['gluteo', 'teste'],
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        active: true,
      },
    });

    const res = await inject('GET', '/api/v1/exercises/catalog?q=ponte', {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(res.statusCode, 200);
    const items = res.json().items as Array<{ namePt: string; videoUrl: string }>;
    assert.ok(Array.isArray(items));
    assert.ok(items.some((item) => /ponte/i.test(item.namePt)));
    assert.ok(items.every((item) => typeof item.videoUrl === 'string' && item.videoUrl.startsWith('https://')));

    const unpaid = await inject('GET', '/api/v1/exercises/catalog?q=ponte', {
      userId: unpaidProfessionalId,
      email: unpaidProfessionalEmail,
    });
    assert.equal(unpaid.statusCode, 403);
    assert.equal(unpaid.json().error, 'payment_required');
  });

  it('returns dynamic progress cards including VAS', async () => {
    const res = await inject('GET', '/api/v1/me/progress', {
      userId: studentId,
      email: studentEmail,
    });
    assert.equal(res.statusCode, 200);
    const keys = res.json().cards.map((card: { key: string }) => card.key);
    assert.ok(keys.includes('adherence'));
    assert.ok(keys.includes('last_pain'));
    assert.ok(keys.includes('avg_pain'));
  });

  it('creates a clinical note and returns it on the chart', async () => {
    const create = await inject('POST', `/api/v1/professional/students/${studentId}/notes`, {
      userId: professionalId,
      email: professionalEmail,
      payload: {
        conduta: 'Manter HEP',
        evolucao: 'Boa adesão',
        informacoesPertinentes: 'Sem red flags',
      },
    });
    assert.equal(create.statusCode, 200);
    assert.equal(create.json().note.conduta, 'Manter HEP');

    const other = await inject('POST', `/api/v1/professional/students/${studentId}/notes`, {
      userId: otherProfessionalId,
      email: otherProfessionalEmail,
      payload: {
        conduta: 'should not work',
        evolucao: 'x',
        informacoesPertinentes: 'y',
      },
    });
    assert.equal(other.statusCode, 404);

    const chart = await inject('GET', `/api/v1/professional/students/${studentId}/chart`, {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(chart.statusCode, 200);
    assert.equal(chart.json().notes.length, 1);
    assert.ok(chart.json().painTimeline.length >= 1);
    assert.ok(
      chart.json().painTimeline.some(
        (point: { patientNote?: string | null; painLevel?: number | null }) =>
          point.painLevel != null || Boolean(point.patientNote)
      )
    );
  });

  it('rejects removing an exercise that has a SessionExerciseLog', async () => {
    const res = await inject('PUT', `/api/v1/professional/programs/${programId}`, {
      userId: professionalId,
      email: professionalEmail,
      payload: {
        title: 'Programa teste',
        targetSessionsPerWeek: 3,
        exercises: [
          {
            id: removableExerciseId,
            orderIndex: 0,
            name: 'Alongamento',
            sets: 2,
            reps: '30s',
          },
        ],
      },
    });
    assert.equal(res.statusCode, 422);
    const body = res.json();
    assert.equal(body.error, 'Validation Error');
    assert.deepEqual(body.blocked_exercise_ids, [loggedExerciseId]);

    const detail = await inject('GET', `/api/v1/professional/students/${studentId}`, {
      userId: professionalId,
      email: professionalEmail,
    });
    const ids = detail.json().program.exercises.map((exercise: { id: string }) => exercise.id);
    assert.ok(ids.includes(loggedExerciseId));
    assert.ok(ids.includes(removableExerciseId));
  });

  it('soft-removes an exercise without session logs', async () => {
    const res = await inject('PUT', `/api/v1/professional/programs/${programId}`, {
      userId: professionalId,
      email: professionalEmail,
      payload: {
        title: 'Programa atualizado',
        phaseLabel: 'Fase 2',
        targetSessionsPerWeek: 4,
        exercises: [
          {
            id: loggedExerciseId,
            orderIndex: 0,
            name: 'Ponte glútea',
            sets: 3,
            reps: '12',
            notes: 'Quadril alto',
          },
        ],
      },
    });
    assert.equal(res.statusCode, 200);
    const exercises = res.json().program.exercises;
    assert.equal(exercises.length, 1);
    assert.equal(exercises[0].id, loggedExerciseId);
    assert.equal(exercises[0].name, 'Ponte glútea');
    assert.equal(res.json().program.targetSessionsPerWeek, 4);

    const stillThere = await prisma.programExercise.findUnique({
      where: { id: removableExerciseId },
    });
    assert.ok(stillThere?.removedAt);
  });

  it('lets a professional CRUD own exercises and forbids other pro PATCH', async () => {
    const create = await inject('POST', '/api/v1/me/exercises', {
      userId: professionalId,
      email: professionalEmail,
      payload: {
        namePt: 'Meu agachamento',
        categoryTags: ['perna', 'forca'],
        videoUrl: 'https://example.com/squat.mp4',
        photoUrls: ['https://example.com/squat-1.jpg'],
        cuesPt: 'Joelhos alinhados',
      },
    });
    assert.equal(create.statusCode, 200);
    const created = create.json().exercise;
    assert.equal(created.namePt, 'Meu agachamento');
    assert.deepEqual(created.categoryTags, ['perna', 'forca']);
    assert.equal(created.videoUrl, 'https://example.com/squat.mp4');
    assert.equal(created.photoUrls[0], 'https://example.com/squat-1.jpg');
    assert.equal(created.active, true);

    const list = await inject('GET', '/api/v1/me/exercises?q=agachamento', {
      userId: professionalId,
      email: professionalEmail,
    });
    assert.equal(list.statusCode, 200);
    assert.ok(
      (list.json().items as Array<{ id: string }>).some((item) => item.id === created.id)
    );

    const otherList = await inject('GET', '/api/v1/me/exercises?q=agachamento', {
      userId: otherProfessionalId,
      email: otherProfessionalEmail,
    });
    assert.equal(otherList.statusCode, 200);
    assert.ok(
      !(otherList.json().items as Array<{ id: string }>).some((item) => item.id === created.id)
    );

    const patch = await inject('PATCH', `/api/v1/me/exercises/${created.id}`, {
      userId: professionalId,
      email: professionalEmail,
      payload: { namePt: 'Agachamento atualizado', cuesPt: 'Peito aberto' },
    });
    assert.equal(patch.statusCode, 200);
    assert.equal(patch.json().exercise.namePt, 'Agachamento atualizado');
    assert.equal(patch.json().exercise.cuesPt, 'Peito aberto');

    const forbidden = await inject('PATCH', `/api/v1/me/exercises/${created.id}`, {
      userId: otherProfessionalId,
      email: otherProfessionalEmail,
      payload: { namePt: 'hack' },
    });
    assert.equal(forbidden.statusCode, 404);
  });

  it('keeps catalog search read-only (no create)', async () => {
    const res = await inject('POST', '/api/v1/exercises/catalog', {
      userId: professionalId,
      email: professionalEmail,
      payload: { namePt: 'should fail', videoUrl: 'https://example.com/x.mp4' },
    });
    assert.ok(res.statusCode === 404 || res.statusCode === 405);
  });

  it('allows a program to mix catalog, professional, and free-text lines', async () => {
    const catalog = await prisma.exerciseCatalogItem.upsert({
      where: { slug: `hep-mix-catalog-${suffix}` },
      update: {
        namePt: 'Catálogo mix',
        categoryTags: ['mix'],
        videoUrl: 'https://example.com/catalog-mix.mp4',
        active: true,
      },
      create: {
        slug: `hep-mix-catalog-${suffix}`,
        namePt: 'Catálogo mix',
        categoryTags: ['mix'],
        videoUrl: 'https://example.com/catalog-mix.mp4',
        active: true,
      },
    });

    const mine = await prisma.professionalExercise.create({
      data: {
        professionalUserId: professionalId,
        namePt: 'Meu exercício mix',
        categoryTags: ['mix', 'pro'],
        videoUrl: 'https://example.com/pro-mix.mp4',
        photoUrls: ['https://example.com/pro-mix.jpg'],
        cuesPt: 'Controle o movimento',
      },
    });

    const res = await inject('PUT', `/api/v1/professional/programs/${programId}`, {
      userId: professionalId,
      email: professionalEmail,
      payload: {
        title: 'Programa misto',
        targetSessionsPerWeek: 3,
        exercises: [
          {
            id: loggedExerciseId,
            orderIndex: 0,
            name: 'Ponte glútea',
            sets: 3,
            reps: '12',
          },
          {
            orderIndex: 1,
            catalogItemId: catalog.id,
            sets: 3,
            reps: '10',
          },
          {
            orderIndex: 2,
            professionalExerciseId: mine.id,
            sets: 2,
            reps: '8',
          },
          {
            orderIndex: 3,
            name: 'Texto livre mix',
            sets: 1,
            reps: '20s',
          },
        ],
      },
    });
    assert.equal(res.statusCode, 200);
    const exercises = res.json().program.exercises as Array<{
      name: string;
      source: string;
      catalogItemId: string | null;
      professionalExerciseId: string | null;
      videoUrl: string | null;
      photoUrls: string[];
    }>;
    assert.equal(exercises.length, 4);

    const catalogLine = exercises.find((exercise) => exercise.catalogItemId === catalog.id);
    assert.ok(catalogLine);
    assert.equal(catalogLine!.source, 'catalog');
    assert.equal(catalogLine!.name, 'Catálogo mix');
    assert.equal(catalogLine!.videoUrl, 'https://example.com/catalog-mix.mp4');
    assert.equal(catalogLine!.professionalExerciseId, null);

    const proLine = exercises.find((exercise) => exercise.professionalExerciseId === mine.id);
    assert.ok(proLine);
    assert.equal(proLine!.source, 'professional');
    assert.equal(proLine!.name, 'Meu exercício mix');
    assert.equal(proLine!.videoUrl, 'https://example.com/pro-mix.mp4');
    assert.deepEqual(proLine!.photoUrls, ['https://example.com/pro-mix.jpg']);
    assert.equal(proLine!.catalogItemId, null);

    const customLine = exercises.find((exercise) => exercise.name === 'Texto livre mix');
    assert.ok(customLine);
    assert.equal(customLine!.source, 'custom');
    assert.equal(customLine!.catalogItemId, null);
    assert.equal(customLine!.professionalExerciseId, null);

    const both = await inject('PUT', `/api/v1/professional/programs/${programId}`, {
      userId: professionalId,
      email: professionalEmail,
      payload: {
        title: 'Programa misto',
        targetSessionsPerWeek: 3,
        exercises: [
          {
            orderIndex: 0,
            catalogItemId: catalog.id,
            professionalExerciseId: mine.id,
            sets: 1,
            reps: '5',
          },
        ],
      },
    });
    assert.equal(both.statusCode, 422);
  });
});
