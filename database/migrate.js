const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv/config');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  console.log('Running migrations...\n');

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const migrationName = file.replace('.sql', '');
    console.log(`  Applying: ${migrationName}`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).single();

    if (error) {
      // Try direct query as fallback
      const { error: directError } = await supabase.from('_migrations').select('name').eq('name', migrationName).single();
      if (!directError) {
        console.log(`    Skipped (already applied): ${migrationName}`);
        continue;
      }
      console.error(`    Failed: ${migrationName}`, error.message);
      console.log('    Note: Run these SQL files directly in your Supabase SQL editor');
    } else {
      console.log(`    Applied: ${migrationName}`);
    }
  }

  console.log('\nMigrations complete.');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
