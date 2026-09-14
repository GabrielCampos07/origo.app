-- =============================================================================
-- Least-privilege DB access: api_app_role for Bloco A tables
-- =============================================================================
-- 
-- PURPOSE:
--   Grant INSERT + SELECT + UPDATE to api_app_role on the Bloco A tables:
--   - professional_profiles
--   - invite_tokens
--   - enrollments
--   Also grants INSERT on users table (supersedes prior omission in #03).
--
-- WHEN TO RUN:
--   - After the Bloco A Slice 1 migration (20260914030500_add_bloco_a_slice_1_schema)
--     has been applied to the target database.
--   - Before the API application switches to using api_app_role credentials.
--
-- IDEMPOTENT:
--   Safe to re-run multiple times. Uses IF NOT EXISTS and DO $$ blocks for
--   idempotent role/grant operations.
--
-- SECURITY POLICY:
--   professional_profiles:
--     - INSERT: API can create professional profiles during signup
--     - SELECT: API can read profiles for enrollment validation
--     - UPDATE: API can update profile metadata (e.g., category changes)
--     - NO DELETE: profile removal reserved for DBA/compliance only
--   
--   invite_tokens:
--     - INSERT: API can create new invite tokens
--     - SELECT: API can validate tokens during student signup
--     - UPDATE: API can mark tokens as used (usedAt timestamp)
--     - NO DELETE: token purge (expired/used) reserved for elevated role (D8 batch job)
--   
--   enrollments:
--     - INSERT: API can create new enrollments via invite redemption
--     - SELECT: API can read enrollment status for authorization
--     - UPDATE: API can update status (ACTIVE → REVOKED) and endedAt
--     - NO DELETE: enrollment records are permanent; deletion reserved for DBA
--   
--   users:
--     - INSERT: API can register new users (PROFESSIONAL + STUDENT signup for Bloco A)
--     - SELECT: Already granted in prior scripts
--     - UPDATE: Already granted in prior scripts
--     - NO DELETE: user deletion reserved for DBA/compliance only
--     Note: Prior scripts (#01, #02) had NO INSERT on users; this script supersedes
--           and grants INSERT for Bloco A registration workflows.
--
-- DATA INTEGRITY ENFORCEMENT (DB Security Checklist):
--   - Partial unique index prevents multiple ACTIVE enrollments per (studentUserId, category)
--   - CHECK constraint prevents self-enrollment (studentUserId <> professionalUserId)
--   
--   Verification queries for DBA/audit review:
--   
--   1. Check for multiple ACTIVE enrollments (should be 0 rows):
--     SELECT "studentUserId", category, COUNT(*) 
--     FROM public.enrollments 
--     WHERE status = 'ACTIVE'
--     GROUP BY "studentUserId", category
--     HAVING COUNT(*) > 1;
--   
--   2. Check for self-enrollments (should be 0 rows, constraint prevents):
--     SELECT id, "studentUserId", "professionalUserId", "createdAt"
--     FROM public.enrollments
--     WHERE "studentUserId" = "professionalUserId";
--
-- DATABASE SECURITY NOTES:
--   - Invite tokens store SHA-256 hash ONLY (never plaintext)
--   - PURPOSE: Enrollment invite system (single-use tokens)
--   - PII: userId fields link to User table (studentUserId, professionalUserId)
--   - PURPOSE: Care relationship tracking (no clinical data stored in these tables)
--   - Least privilege: No DELETE grants on any tables
--   - Token purge and record deletion via elevated role or compliance directive
--
-- RELATED:
--   - Bloco A Slice 1 schema migration: 20260914030500_add_bloco_a_slice_1_schema
--   - Pattern reference: deploy/sql/02_api_app_role_referral_tables.sql
--   - D8 token purge pattern: deploy/sql/01_api_app_role_legal_acceptances.sql
--
-- =============================================================================

-- Create api_app_role if it doesn't exist
-- Note: Password must be set separately via ALTER ROLE or environment config
-- Note: This role may already exist from 01_api_app_role_legal_acceptances.sql
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

-- Grant USAGE on schema public (required for accessing objects)
-- Idempotent: safe to grant multiple times
GRANT USAGE ON SCHEMA public TO api_app_role;

-- ==================== users (INSERT for Bloco A registration) ====================
-- Revoke ALL first to ensure clean state, then grant specific privileges
REVOKE ALL ON TABLE public.users FROM api_app_role;

-- Grant SELECT + INSERT + UPDATE on users
-- INSERT newly required for PROFESSIONAL + STUDENT signup in Bloco A
-- UPDATE needed for profile updates (e.g., name, role)
-- Explicitly NO DELETE (user removal reserved for DBA/compliance)
GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO api_app_role;

-- ==================== professional_profiles ====================
-- Grant SELECT + INSERT + UPDATE on professional_profiles
-- Explicitly NO DELETE (profile removal reserved for DBA)
GRANT SELECT, INSERT, UPDATE ON TABLE public.professional_profiles TO api_app_role;

-- ==================== invite_tokens ====================
-- Grant SELECT + INSERT + UPDATE on invite_tokens
-- UPDATE needed for marking tokens as used (usedAt timestamp)
-- Explicitly NO DELETE (token purge via elevated role D8 batch job)
GRANT SELECT, INSERT, UPDATE ON TABLE public.invite_tokens TO api_app_role;

-- ==================== enrollments ====================
-- Grant SELECT + INSERT + UPDATE on enrollments
-- UPDATE needed for status transitions (ACTIVE → REVOKED) and endedAt
-- Explicitly NO DELETE (enrollment records are permanent)
GRANT SELECT, INSERT, UPDATE ON TABLE public.enrollments TO api_app_role;

-- Note: All table IDs use CUID (generated by app), no sequence grants needed

-- =============================================================================
-- Verify grants (informational queries - comment out in production automation)
-- =============================================================================

-- SELECT 
--   table_name,
--   grantee, 
--   privilege_type 
-- FROM information_schema.table_privileges 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('professional_profiles', 'invite_tokens', 'enrollments', 'users')
--   AND grantee = 'api_app_role'
-- ORDER BY table_name, privilege_type;

-- Expected result for Bloco A tables:
-- table_name           | grantee      | privilege_type
-- ---------------------|--------------|---------------
-- enrollments          | api_app_role | INSERT
-- enrollments          | api_app_role | SELECT
-- enrollments          | api_app_role | UPDATE
-- invite_tokens        | api_app_role | INSERT
-- invite_tokens        | api_app_role | SELECT
-- invite_tokens        | api_app_role | UPDATE
-- professional_profiles| api_app_role | INSERT
-- professional_profiles| api_app_role | SELECT
-- professional_profiles| api_app_role | UPDATE
-- users                | api_app_role | INSERT
-- users                | api_app_role | SELECT
-- users                | api_app_role | UPDATE

DO $$
BEGIN
  RAISE NOTICE 'Grants applied: api_app_role has appropriate privileges for Bloco A tables';
  RAISE NOTICE '  - professional_profiles: SELECT + INSERT + UPDATE (no DELETE)';
  RAISE NOTICE '  - invite_tokens: SELECT + INSERT + UPDATE (no DELETE; purge elevated)';
  RAISE NOTICE '  - enrollments: SELECT + INSERT + UPDATE (no DELETE)';
  RAISE NOTICE '  - users: SELECT + INSERT + UPDATE (INSERT newly granted for Bloco A registration)';
  RAISE NOTICE 'DATA INTEGRITY enforced by migration:';
  RAISE NOTICE '  - Partial unique index: ONE ACTIVE enrollment per (studentUserId, category)';
  RAISE NOTICE '  - CHECK constraint: no self-enrollment (studentUserId <> professionalUserId)';
END
$$;
