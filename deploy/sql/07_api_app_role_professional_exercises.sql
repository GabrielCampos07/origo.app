-- =============================================================================
-- Least-privilege DB access: api_app_role for professional_exercises
-- =============================================================================
--
-- PURPOSE:
--   Grant SELECT+INSERT+UPDATE on professional-owned exercise library.
--   Soft-deactivate via `active` (no DELETE privilege).
--   program_exercises already has INSERT+UPDATE so professionalExerciseId
--   can be set on HEP lines.
--
-- WHEN TO RUN:
--   - After migration 20260914220000_add_professional_exercises
--   - Before the API uses api_app_role credentials against this table
--
-- IDEMPOTENT:
--   Safe to re-run. Uses IF NOT EXISTS and DO $$ blocks.
--
-- SECURITY POLICY:
--   professional_exercises: SELECT+INSERT+UPDATE (no DELETE for api_app_role)
--
-- RELATED:
--   - Migration: 20260914220000_add_professional_exercises
--   - Pattern: deploy/sql/05_api_app_role_hep_tables.sql
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

-- ==================== professional_exercises ====================
REVOKE ALL ON TABLE public.professional_exercises FROM api_app_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.professional_exercises TO api_app_role;

DO $$
BEGIN
  RAISE NOTICE 'Grants applied: api_app_role has SELECT+INSERT+UPDATE on professional_exercises';
END
$$;
