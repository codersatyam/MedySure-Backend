-- Migration: 005_handle_new_user
-- Description: Auto-provision an organization + profile + Owner group for every
--   new auth user. Fires for BOTH email/password and OAuth signups.
--   Runs as one transaction so provisioning can never partially fail.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_local      TEXT;
  v_org_name   TEXT;
  v_slug       TEXT;
  v_first_name TEXT;
  v_last_name  TEXT;
  v_org_id     UUID;
  v_owner_group_id UUID;
BEGIN
  -- Local-part of the email, used as a sane default for names/slug.
  v_local := split_part(NEW.email, '@', 1);

  -- Names: prefer signup metadata, fall back to email local-part.
  v_first_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), v_local);
  v_last_name  := COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), '');

  -- Org name: prefer metadata, else "<local>'s Organization".
  v_org_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'org_name', ''),
    initcap(v_local) || '''s Organization'
  );

  -- Slug: email local-part + the full user UUID, guaranteeing uniqueness.
  v_slug := lower(regexp_replace(v_local, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || NEW.id::text;

  -- 1) Organization (created_by = the new user).
  INSERT INTO organizations (name, slug, created_by)
  VALUES (v_org_name, v_slug, NEW.id)
  RETURNING id INTO v_org_id;

  -- 2) Profile linked to the org.
  INSERT INTO profiles (id, first_name, last_name, org_id)
  VALUES (NEW.id, v_first_name, v_last_name, v_org_id);

  -- 3) Grant the Owner system group (full *:* access).
  SELECT id INTO v_owner_group_id
  FROM permission_groups
  WHERE name = 'Owner' AND org_id IS NULL AND deleted_at IS NULL
  LIMIT 1;

  -- Provisioning is all-or-nothing: a missing Owner group must abort signup
  -- rather than create a permission-less (locked-out) user.
  IF v_owner_group_id IS NULL THEN
    RAISE EXCEPTION 'Owner permission group not found; apply migration 003 before creating users';
  END IF;

  INSERT INTO user_permission_groups (user_id, group_id, org_id)
  VALUES (NEW.id, v_owner_group_id, v_org_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
