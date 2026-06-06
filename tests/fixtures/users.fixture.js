const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'testuser@medysure.com',
  profile: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    avatar_url: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
  },
  roles: ['admin'],
  permissions: [
    'patient:create', 'patient:read', 'patient:update', 'patient:delete', 'patient:list',
    'doctor:create', 'doctor:read', 'doctor:update', 'doctor:delete', 'doctor:list',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:cancel', 'appointment:list',
    'billing:create', 'billing:read', 'billing:update',
    'staff:manage', 'analytics:view', 'settings:manage', 'notification:read',
  ],
};

const testDoctor = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'doctor@medysure.com',
  roles: ['doctor'],
  permissions: [
    'patient:read', 'patient:update', 'patient:list',
    'doctor:read', 'doctor:update', 'doctor:list',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:cancel', 'appointment:list',
    'analytics:view', 'notification:read',
  ],
};

const testPatient = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  email: 'patient@medysure.com',
  roles: ['patient'],
  permissions: [
    'patient:read',
    'doctor:read', 'doctor:list',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:cancel',
    'billing:read', 'notification:read',
  ],
};

module.exports = { testUser, testDoctor, testPatient };
