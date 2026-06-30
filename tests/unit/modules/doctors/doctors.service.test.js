const DoctorsService = require('../../../../src/modules/doctors/services/doctors.service');
const { createMockLogger } = require('../../../helpers/mocks');

const ORG_ID = 'org-1';

const dbRow = {
  id: 'doc-1',
  first_name: 'Asha',
  last_name: 'Verma',
  email: 'asha@clinic.com',
  phone: '+919876543210',
  specialization: 'Cardiology',
  qualification: ['MBBS', 'MD'],
  age: 42,
  photo_url: 'https://cdn/x.jpg',
  total_experience: '12.5',
  consulting_fees: '800.00',
  license_number: 'MH-12345',
  is_active: true,
  created_at: '2026-06-30T00:00:00Z',
};

describe('DoctorsService', () => {
  let service;
  let doctorsRepository;
  let logger;

  beforeEach(() => {
    doctorsRepository = {
      create: jest.fn(),
      findAllByOrg: jest.fn(),
      findByIdInOrg: jest.fn(),
      update: jest.fn(),
      uploadPhoto: jest.fn(),
      getPublicUrl: jest.fn(),
    };
    logger = createMockLogger();
    service = new DoctorsService({ doctorsRepository, logger });
  });

  it('addDoctor maps camelCase input to snake_case and returns a camelCase DTO', async () => {
    doctorsRepository.create.mockResolvedValue(dbRow);

    const result = await service.addDoctor(ORG_ID, {
      firstName: 'Asha',
      lastName: 'Verma',
      email: 'asha@clinic.com',
      phone: '+919876543210',
      specialization: 'Cardiology',
      qualification: ['MBBS', 'MD'],
      age: 42,
      photoUrl: 'https://cdn/x.jpg',
      totalExperience: 12.5,
      consultingFees: 800,
      licenseNumber: 'MH-12345',
    });

    expect(doctorsRepository.create).toHaveBeenCalledWith(ORG_ID, {
      first_name: 'Asha',
      last_name: 'Verma',
      email: 'asha@clinic.com',
      phone: '+919876543210',
      specialization: 'Cardiology',
      qualification: ['MBBS', 'MD'],
      age: 42,
      photo_url: 'https://cdn/x.jpg',
      total_experience: 12.5,
      consulting_fees: 800,
      license_number: 'MH-12345',
    });

    expect(result).toMatchObject({
      id: 'doc-1',
      firstName: 'Asha',
      lastName: 'Verma',
      qualification: ['MBBS', 'MD'],
      totalExperience: 12.5,
      consultingFees: 800,
      createdAt: '2026-06-30T00:00:00Z',
    });
  });

  it('addDoctor does not log PII (email/phone)', async () => {
    doctorsRepository.create.mockResolvedValue(dbRow);

    await service.addDoctor(ORG_ID, {
      firstName: 'Asha',
      lastName: 'Verma',
      email: 'asha@clinic.com',
      phone: '+919876543210',
    });

    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).not.toContain('asha@clinic.com');
    expect(logged).not.toContain('+919876543210');
  });

  it('addDoctor wraps repository errors in a 500 AppError', async () => {
    doctorsRepository.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.addDoctor(ORG_ID, { firstName: 'Asha', lastName: 'Verma' })
    ).rejects.toMatchObject({ statusCode: 500, code: 'DOCTOR_CREATE_FAILED' });
  });

  it('listDoctors passes orgId to the repo and returns a mapped DTO array', async () => {
    doctorsRepository.findAllByOrg.mockResolvedValue([dbRow]);

    const result = await service.listDoctors(ORG_ID);

    expect(doctorsRepository.findAllByOrg).toHaveBeenCalledWith(ORG_ID);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'doc-1',
      firstName: 'Asha',
      consultingFees: 800,
      totalExperience: 12.5,
    });
  });

  it('listDoctors wraps repository errors in a 500 AppError', async () => {
    doctorsRepository.findAllByOrg.mockRejectedValue(new Error('db down'));

    await expect(service.listDoctors(ORG_ID)).rejects.toMatchObject({
      statusCode: 500,
      code: 'DOCTOR_LIST_FAILED',
    });
  });

  it('updateDoctor maps only provided fields to a snake_case patch and returns a DTO', async () => {
    doctorsRepository.update.mockResolvedValue({ ...dbRow, consulting_fees: '950.00' });

    const result = await service.updateDoctor(ORG_ID, 'doc-1', {
      consultingFees: 950,
      isActive: false,
    });

    expect(doctorsRepository.update).toHaveBeenCalledWith(ORG_ID, 'doc-1', {
      consulting_fees: 950,
      is_active: false,
    });
    expect(result.consultingFees).toBe(950);
  });

  it('updateDoctor throws 404 NotFoundError when the doctor does not exist', async () => {
    doctorsRepository.update.mockResolvedValue(null);

    await expect(
      service.updateDoctor(ORG_ID, 'missing', { consultingFees: 100 })
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('uploadDoctorPhoto uploads, sets photo_url, and returns id + photoUrl', async () => {
    doctorsRepository.findByIdInOrg.mockResolvedValue(dbRow);
    doctorsRepository.getPublicUrl.mockReturnValue('https://cdn.test/p.png');
    doctorsRepository.update.mockResolvedValue(dbRow);

    const file = { buffer: Buffer.from('x'), mimetype: 'image/png' };
    const result = await service.uploadDoctorPhoto(ORG_ID, 'doc-1', file);

    expect(doctorsRepository.uploadPhoto).toHaveBeenCalledWith(
      expect.stringMatching(/^org-1\/doc-1\/.+\.png$/),
      file.buffer,
      'image/png'
    );
    expect(doctorsRepository.update).toHaveBeenCalledWith(ORG_ID, 'doc-1', {
      photo_url: 'https://cdn.test/p.png',
    });
    expect(result).toEqual({ id: 'doc-1', photoUrl: 'https://cdn.test/p.png' });
  });

  it('uploadDoctorPhoto throws 404 when the doctor does not exist', async () => {
    doctorsRepository.findByIdInOrg.mockResolvedValue(null);

    await expect(
      service.uploadDoctorPhoto(ORG_ID, 'missing', { buffer: Buffer.from('x'), mimetype: 'image/png' })
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    expect(doctorsRepository.uploadPhoto).not.toHaveBeenCalled();
  });
});
