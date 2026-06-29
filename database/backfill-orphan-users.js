// Backfill org + profile + Owner group for any auth user that doesn't have a
// profile yet (e.g. users created before the on_auth_user_created trigger
// existed, such as the first OAuth sign-ins). Idempotent: skips users that
// already have a profile. Mirrors the handle_new_user() trigger logic.
//
// Requires the schema (database/setup.sql) to be applied first.
// Run with: node database/backfill-orphan-users.js
require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false } });

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function run() {
  // Owner system group (full *:* access)
  const { data: ownerGroup, error: ownerErr } = await admin
    .from('permission_groups')
    .select('id')
    .eq('name', 'Owner')
    .is('org_id', null)
    .is('deleted_at', null)
    .maybeSingle();
  if (ownerErr) {
    console.error('Could not read permission_groups — is the schema applied?', ownerErr.message);
    process.exit(1);
  }
  if (!ownerGroup) {
    console.error('Owner permission group missing. Apply database/setup.sql first.');
    process.exit(1);
  }

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error('listUsers failed:', listErr.message);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  for (const u of list.users) {
    const { data: existing } = await admin.from('profiles').select('id').eq('id', u.id).maybeSingle();
    if (existing) {
      skipped += 1;
      continue;
    }

    const meta = u.user_metadata || {};
    const local = (u.email || 'user').split('@')[0];
    const firstName = meta.first_name || meta.given_name || (meta.full_name || meta.name || local).split(' ')[0] || local;
    const lastName = meta.last_name || meta.family_name || '';
    const orgName = meta.org_name || `${local.charAt(0).toUpperCase()}${local.slice(1)}'s Organization`;
    const slug = `${slugify(local)}-${u.id}`;

    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({ name: orgName, slug, created_by: u.id })
      .select('id')
      .single();
    if (orgErr) {
      console.error(`  ! org insert failed for ${u.email}:`, orgErr.message);
      continue;
    }

    const { error: profErr } = await admin
      .from('profiles')
      .insert({ id: u.id, first_name: firstName, last_name: lastName, org_id: org.id });
    if (profErr) {
      console.error(`  ! profile insert failed for ${u.email}:`, profErr.message);
      continue;
    }

    const { error: grantErr } = await admin
      .from('user_permission_groups')
      .insert({ user_id: u.id, group_id: ownerGroup.id, org_id: org.id });
    if (grantErr) {
      console.error(`  ! owner-group grant failed for ${u.email}:`, grantErr.message);
      continue;
    }

    console.log(`  + provisioned ${u.email} -> org "${orgName}"`);
    created += 1;
  }

  console.log(`\nDone. Provisioned ${created}, skipped ${skipped} (already had a profile).`);
}

run().catch((e) => {
  console.error('Backfill failed:', e.message);
  process.exit(1);
});
