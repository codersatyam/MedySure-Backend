const Joi = require('joi');
const validate = require('../../../src/middlewares/validate.middleware');
const { createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');

describe('Validate Middleware', () => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(1).required(),
  });

  it('should pass validation with valid data', () => {
    const middleware = validate(schema);
    const req = createMockRequest({ body: { email: 'test@test.com', name: 'Test' } });
    const next = createMockNext();

    middleware(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe('test@test.com');
  });

  it('should return ValidationError with invalid data', () => {
    const middleware = validate(schema);
    const req = createMockRequest({ body: { email: 'invalid', name: '' } });
    const next = createMockNext();

    middleware(req, createMockResponse(), next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should strip unknown fields', () => {
    const middleware = validate(schema);
    const req = createMockRequest({
      body: { email: 'test@test.com', name: 'Test', unknown: 'value' },
    });
    const next = createMockNext();

    middleware(req, createMockResponse(), next);

    expect(req.body.unknown).toBeUndefined();
  });
});
