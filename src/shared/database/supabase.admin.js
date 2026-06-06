const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../../config/supabase.config');

let supabaseAdmin = null;

const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      supabaseConfig.url,
      supabaseConfig.serviceRoleKey,
      {
        ...supabaseConfig.options,
        auth: {
          ...supabaseConfig.options.auth,
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdmin;
};

module.exports = { getSupabaseAdmin };
