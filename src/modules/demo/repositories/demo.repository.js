class DemoRepository {
  constructor({ supabaseAdmin }) {
    this.supabaseAdmin = supabaseAdmin;
    this.table = 'demo_requests';
  }

  async create({ name, email, phoneNo }) {
    const { data, error } = await this.supabaseAdmin
      .from(this.table)
      .insert({ name, email, phone_no: phoneNo })
      .select('id, created_at')
      .single();

    if (error) {
      throw error;
    }
    return data;
  }
}

module.exports = DemoRepository;
