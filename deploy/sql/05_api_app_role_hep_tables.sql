-- =============================================================================
-- Least-privilege DB access: api_app_role for Slice 2–3 HEP tables
-- =============================================================================
--
-- PURPOSE:
--   Grant table privileges for Home Exercise Program + clinical chart:
--   - programs
--   - program_exercises
--   - workout_sessions
--   - session_exercise_logs
--   - clinical_notes
--
-- WHEN TO RUN:
--   - After the HEP Slice 2–3 migration (20260914180000_add_hep_slice_2_3_schema)
--     has been applied to the target database.
--   - Before the API application switches to using api_app_role credentials.
--
-- IDEMPOTENT:
--   Safe to re-run multiple times. Uses IF NOT EXISTS and DO $$ blocks.
--
-- SECURITY POLICY:
--   programs / program_exercises / workout_sessions / session_exercise_logs:
--     - INSERT + SELECT + UPDATE
--     - NO DELETE (soft-remove ProgramExercise via removedAt; purge elevated)
--
--   clinical_notes:
--     - INSERT + SELECT only (append-only prontuário)
--     - NO UPDATE / NO DELETE
--
--   Exercise lines with SessionExerciseLog rows are never removed by the API.
--   Soft-delete (removedAt) is used instead of DELETE so api_app_role stays
--   without DELETE privilege.
--
-- RELATED:
--   - HEP schema migration: 20260914180000_add_hep_slice_2_3_schema
--   - Pattern reference: deploy/sql/04_api_app_role_bloco_a_tables.sql
--
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'api_app_role'
  ) THEN
    CREATE ROLE api_app_role WITH LOGIN;
    RAISE NOTICE 'Created role: api_app_role';
  ELSE
    RAISE NOTICE 'Role api_app_role already exists';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO api_app_role;

-- ==================== programs ====================
REVOKE ALL ON TABLE public.programs FROM api_app_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.programs TO api_app_role;

-- ==================== program_exercises ====================
REVOKE ALL ON TABLE public.program_exercises FROM api_app_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.program_exercises TO api_app_role;

-- ==================== workout_sessions ====================
REVOKE ALL ON TABLE public.workout_sessions FROM api_app_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.workout_sessions TO api_app_role;

-- ==================== session_exercise_logs ====================
REVOKE ALL ON TABLE public.session_exercise_logs FROM api_app_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.session_exercise_logs TO api_app_role;

-- ==================== clinical_notes (append-only) ====================
REVOKE ALL ON TABLE public.clinical_notes FROM api_app_role;
GRANT SELECT, INSERT ON TABLE public.clinical_notes TO api_app_role;

DO $$
BEGIN
  RAISE NOTICE 'Grants applied: api_app_role has Slice 2–3 HEP privileges';
  RAISE NOTICE '  - programs: SELECT + INSERT + UPDATE (no DELETE)';
  RAISE NOTICE '  - program_exercises: SELECT + INSERT + UPDATE (no DELETE; soft-remove via removedAt)';
  RAISE NOTICE '  - workout_sessions: SELECT + INSERT + UPDATE (no DELETE)';
  RAISE NOTICE '  - session_exercise_logs: SELECT + INSERT + UPDATE (no DELETE)';
  RAISE NOTICE '  - clinical_notes: SELECT + INSERT only (append-only, no UPDATE/DELETE)';
END
$$;
