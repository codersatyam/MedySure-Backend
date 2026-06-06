// TODO: Implement User repository methods
class UserRepository {
  constructor({ supabaseAdmin }) {
    this.supabase = supabaseAdmin;
  }
}

module.exports = UserRepository;
