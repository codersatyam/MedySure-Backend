const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../../../shared/errors');
const { ALLOWED_PHOTO_MIME } = require('../constants/doctors.constants');

// Map camelCase update input to a snake_case patch, including only provided keys.
const FIELD_MAP = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  specialization: 'specialization',
  qualification: 'qualification',
  age: 'age',
  photoUrl: 'photo_url',
  totalExperience: 'total_experience',
  consultingFees: 'consulting_fees',
  licenseNumber: 'license_number',
  isActive: 'is_active',
};

const toPatch = (input) => {
  const patch = {};
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    if (input[camel] !== undefined) {
      patch[snake] = input[camel];
    }
  }
  return patch;
};

// Supabase returns NUMERIC columns as strings; coerce back to numbers (or null).
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

// Map a DB row (snake_case) to the API DTO (camelCase).
const toDto = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  specialization: row.specialization,
  qualification: row.qualification || [],
  age: row.age,
  photoUrl: row.photo_url,
  totalExperience: toNumber(row.total_experience),
  consultingFees: toNumber(row.consulting_fees),
  licenseNumber: row.license_number,
  isActive: row.is_active,
  createdAt: row.created_at,
});

class DoctorsService {
  constructor({ doctorsRepository, logger }) {
    this.doctorsRepository = doctorsRepository;
    this.logger = logger;
  }

  async addDoctor(orgId, input) {
    try {
      const row = await this.doctorsRepository.create(orgId, {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        specialization: input.specialization,
        qualification: input.qualification,
        age: input.age,
        photo_url: input.photoUrl,
        total_experience: input.totalExperience,
        consulting_fees: input.consultingFees,
        license_number: input.licenseNumber,
      });
      // Do not log PII (email/phone) — only ids.
      this.logger.info('Doctor created', { id: row.id, orgId });
      return toDto(row);
    } catch (err) {
      this.logger.error('Failed to create doctor', { orgId, message: err.message });
      throw new AppError('Could not create doctor', 500, 'DOCTOR_CREATE_FAILED');
    }
  }

  async listDoctors(orgId) {
    try {
      const rows = await this.doctorsRepository.findAllByOrg(orgId);
      return rows.map(toDto);
    } catch (err) {
      this.logger.error('Failed to list doctors', { orgId, message: err.message });
      throw new AppError('Could not list doctors', 500, 'DOCTOR_LIST_FAILED');
    }
  }

  async updateDoctor(orgId, id, input) {
    try {
      const row = await this.doctorsRepository.update(orgId, id, toPatch(input));
      if (!row) {
        throw new NotFoundError('Doctor');
      }
      this.logger.info('Doctor updated', { id, orgId });
      return toDto(row);
    } catch (err) {
      if (err.isOperational) {
        throw err;
      }
      this.logger.error('Failed to update doctor', { id, orgId, message: err.message });
      throw new AppError('Could not update doctor', 500, 'DOCTOR_UPDATE_FAILED');
    }
  }

  async uploadDoctorPhoto(orgId, id, file) {
    try {
      const doctor = await this.doctorsRepository.findByIdInOrg(orgId, id);
      if (!doctor) {
        throw new NotFoundError('Doctor');
      }

      const ext = ALLOWED_PHOTO_MIME[file.mimetype];
      const path = `${orgId}/${id}/${uuidv4()}.${ext}`;
      await this.doctorsRepository.uploadPhoto(path, file.buffer, file.mimetype);
      const photoUrl = this.doctorsRepository.getPublicUrl(path);

      await this.doctorsRepository.update(orgId, id, { photo_url: photoUrl });
      this.logger.info('Doctor photo uploaded', { id, orgId });
      return { id, photoUrl };
    } catch (err) {
      if (err.isOperational) {
        throw err;
      }
      this.logger.error('Failed to upload doctor photo', { id, orgId, message: err.message });
      throw new AppError('Could not upload doctor photo', 500, 'DOCTOR_PHOTO_UPLOAD_FAILED');
    }
  }
}

module.exports = DoctorsService;
