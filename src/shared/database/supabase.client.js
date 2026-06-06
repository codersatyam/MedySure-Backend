const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../../config/supabase.config');

let supabaseClient = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      supabaseConfig.options
    );
  }
  return supabaseClient;
};

module.exports = { getSupabaseClient };
