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
    method: 'GET' | 'POST' | 'PUT',
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
      { userId: studentId, email: studentEmail, payload: { painLevel: 2 } }
    );
    assert.equal(completeSession.statusCode, 200);
    assert.equal(completeSession.json().session.status, 'COMPLETED');
    assert.equal(completeSession.json().session.painLevel, 2);
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
});
