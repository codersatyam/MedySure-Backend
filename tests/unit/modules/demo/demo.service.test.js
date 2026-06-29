const DemoService = require('../../../../src/modules/demo/services/demo.service');
const { createMockLogger } = require('../../../helpers/mocks');

describe('DemoService', () => {
  let service;
  let demoRepository;
  let logger;

  beforeEach(() => {
    demoRepository = { create: jest.fn() };
    logger = createMockLogger();
    service = new DemoService({ demoRepository, logger });
  });

  it('creates a demo request and returns id + createdAt', async () => {
    demoRepository.create.mockResolvedValue({ id: 'd1', created_at: '2026-06-29T00:00:00Z' });

    const result = await service.requestDemo({
      name: 'Jane Doe',
      email: 'jane@clinic.com',
      phoneNo: '+919876543210',
    });

    expect(result).toEqual({ id: 'd1', createdAt: '2026-06-29T00:00:00Z' });
    expect(demoRepository.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@clinic.com',
      phoneNo: '+919876543210',
    });
  });

  it('does not log PII (email/phone)', async () => {
    demoRepository.create.mockResolvedValue({ id: 'd1', created_at: 'now' });
    await service.requestDemo({ name: 'Jane', email: 'jane@clinic.com', phoneNo: '+911234567' });

    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).not.toContain('jane@clinic.com');
    expect(logged).not.toContain('+911234567');
  });

  it('wraps repository errors in a 500 AppError', async () => {
    demoRepository.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.requestDemo({ name: 'Jane', email: 'jane@clinic.com', phoneNo: '+911234567' })
    ).rejects.toMatchObject({ statusCode: 500, code: 'DEMO_REQUEST_FAILED' });
  });
});
