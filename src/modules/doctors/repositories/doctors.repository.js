const { DOCTORS_TABLE, DOCTOR_PHOTOS_BUCKET } = require('../constants/doctors.constants');

const DOCTOR_COLUMNS =
  'id, first_name, last_name, email, phone, specialization, qualification, ' +
  'age, photo_url, total_experience, consulting_fees, license_number, ' +
  'is_active, created_at';

class DoctorsRepository {
  constructor({ supabaseAdmin }) {
    this.supabaseAdmin = supabaseAdmin;
    this.table = DOCTORS_TABLE;
  }

  async create(orgId, doctor) {
    const { data, error } = await this.supabaseAdmin
      .from(this.table)
      .insert({ org_id: orgId, ...doctor })
      .select(DOCTOR_COLUMNS)
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  async findAllByOrg(orgId) {
    const { data, error } = await this.supabaseAdmin
      .from(this.table)
      .select(DOCTOR_COLUMNS)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data;
  }

  async findByIdInOrg(orgId, id) {
    const { data, error } = await this.supabaseAdmin
      .from(this.table)
      .select(DOCTOR_COLUMNS)
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  }

  async update(orgId, id, patch) {
    const { data, error } = await this.supabaseAdmin
      .from(this.table)
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .select(DOCTOR_COLUMNS)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  }

  async uploadPhoto(path, buffer, contentType) {
    const { error } = await this.supabaseAdmin.storage
      .from(DOCTOR_PHOTOS_BUCKET)
      .upload(path, buffer, { contentType, upsert: true });

    if (error) {
      throw error;
    }
  }

  getPublicUrl(path) {
    const { data } = this.supabaseAdmin.storage.from(DOCTOR_PHOTOS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}

module.exports = DoctorsRepository;
