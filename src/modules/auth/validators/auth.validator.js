const Joi = require('joi');
const { OAUTH_PROVIDERS } = require('../constants/auth.constants');

// Strong-ish password: min 8 chars, at least one letter and one number.
const password = Joi.string()
  .min(8)
  .max(72) // bcrypt/Supabase practical upper bound
  .pattern(/[A-Za-z]/, 'letter')
  .pattern(/[0-9]/, 'number')
  .required()
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
  });

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password,
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().max(100).allow('').default(''),
  orgName: Joi.string().trim().min(1).max(150).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const oauthSchema = Joi.object({
  provider: Joi.string()
    .valid(...OAUTH_PROVIDERS)
    .required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
  oauthSchema,
};
