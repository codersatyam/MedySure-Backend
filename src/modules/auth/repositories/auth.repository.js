// TODO: Implement Auth repository methods
class AuthRepository {
  constructor({ supabaseAdmin }) {
    this.supabase = supabaseAdmin;
  }
}

module.exports = AuthRepository;
