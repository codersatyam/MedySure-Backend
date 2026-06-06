const testPatientRecord = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  profile_id: '550e8400-e29b-41d4-a716-446655440003',
  date_of_birth: '1990-05-15',
  gender: 'male',
  blood_group: 'O+',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '+1987654321',
  address: '123 Health St, Medical City',
  medical_history: [{ condition: 'Asthma', diagnosed: '2015' }],
  allergies: ['Penicillin'],
  insurance_provider: 'HealthPlus',
  insurance_id: 'HP-12345',
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  deleted_at: null,
  profiles: {
    first_name: 'John',
    last_name: 'Patient',
    phone: '+1234567890',
  },
};

const createPatientInput = {
  firstName: 'Jane',
  lastName: 'New',
  email: 'jane@example.com',
  dateOfBirth: '1985-03-20',
  gender: 'female',
  bloodGroup: 'A+',
  emergencyContactName: 'John New',
  emergencyContactPhone: '+1111111111',
  address: '456 Care Ave',
};

module.exports = { testPatientRecord, createPatientInput };
