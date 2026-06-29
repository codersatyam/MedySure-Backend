const { AppError } = require('../../../shared/errors');

class DemoService {
  constructor({ demoRepository, logger }) {
    this.demoRepository = demoRepository;
    this.logger = logger;
  }

  async requestDemo({ name, email, phoneNo }) {
    try {
      const row = await this.demoRepository.create({ name, email, phoneNo });
      // Do not log email/phone (PII) — only the generated id.
      this.logger.info('Demo request created', { id: row.id });
      return { id: row.id, createdAt: row.created_at };
    } catch (err) {
      this.logger.error('Failed to create demo request', { message: err.message });
      throw new AppError('Could not submit demo request', 500, 'DEMO_REQUEST_FAILED');
    }
  }
}

module.exports = DemoService;
