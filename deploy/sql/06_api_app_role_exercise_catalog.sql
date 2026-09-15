-- =============================================================================
-- Least-privilege DB access: api_app_role for exercise_catalog_items
-- =============================================================================
--
-- PURPOSE:
--   Grant SELECT on the curated exercise video catalog.
--   API currently only reads catalog items (search + join for video fields).
--   Writes happen via seed / owner role.
--
-- WHEN TO RUN:
--   - After migration 20260914210000_add_patient_note_and_exercise_catalog
--   - Before the API uses api_app_role credentials against catalog joins
--
-- IDEMPOTENT:
--   Safe to re-run. Uses IF NOT EXISTS and DO $$ blocks.
--
-- SECURITY POLICY:
--   exercise_catalog_items: SELECT only (no INSERT/UPDATE/DELETE for api_app_role)
--   program_exercises still has INSERT+UPDATE so catalogItemId can be set on HEP lines
--
-- RELATED:
--   - Migration: 20260914210000_add_patient_note_and_exercise_catalog
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

-- ==================== exercise_catalog_items (read-only for API) ====================
REVOKE ALL ON TABLE public.exercise_catalog_items FROM api_app_role;
GRANT SELECT ON TABLE public.exercise_catalog_items TO api_app_role;

DO $$
BEGIN
  RAISE NOTICE 'Grants applied: api_app_role has SELECT on exercise_catalog_items';
END
$$;
