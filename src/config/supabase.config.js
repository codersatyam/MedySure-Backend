const config = require('./index');

const supabaseConfig = {
  url: config.supabase.url,
  anonKey: config.supabase.anonKey,
  serviceRoleKey: config.supabase.serviceRoleKey,
  options: {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
};

module.exports = supabaseConfig;
