const Joi = require('joi');

const demoRequestSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  phoneNo: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-()]{7,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'phoneNo must be a valid phone number',
    }),
});

module.exports = { demoRequestSchema };
