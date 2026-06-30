const Joi = require('joi');

// Shared field rules reused by create (required where noted) and update (all optional).
const fields = {
  firstName: Joi.string().trim().min(1).max(100),
  lastName: Joi.string().trim().min(1).max(100),
  email: Joi.string().email().max(255),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-()]{7,20}$/)
    .messages({ 'string.pattern.base': 'phone must be a valid phone number' }),
  specialization: Joi.string().trim().max(150),
  qualification: Joi.array().items(Joi.string().trim().max(100)),
  age: Joi.number().integer().min(20).max(120),
  photoUrl: Joi.string().uri().max(2048),
  totalExperience: Joi.number().min(0).max(80),
  consultingFees: Joi.number().min(0),
  licenseNumber: Joi.string().trim().max(100),
  isActive: Joi.boolean(),
};

const createDoctorSchema = Joi.object({
  firstName: fields.firstName.required(),
  lastName: fields.lastName.required(),
  email: fields.email.optional(),
  phone: fields.phone.optional(),
  specialization: fields.specialization.optional(),
  qualification: fields.qualification.default([]),
  age: fields.age.optional(),
  photoUrl: fields.photoUrl.optional(),
  totalExperience: fields.totalExperience.optional(),
  consultingFees: fields.consultingFees.optional(),
  licenseNumber: fields.licenseNumber.optional(),
});

// Partial update: every field optional, but at least one must be provided.
const updateDoctorSchema = Joi.object({
  firstName: fields.firstName,
  lastName: fields.lastName,
  email: fields.email,
  phone: fields.phone,
  specialization: fields.specialization,
  qualification: fields.qualification,
  age: fields.age,
  photoUrl: fields.photoUrl,
  totalExperience: fields.totalExperience,
  consultingFees: fields.consultingFees,
  licenseNumber: fields.licenseNumber,
  isActive: fields.isActive,
}).min(1);

const doctorIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { createDoctorSchema, updateDoctorSchema, doctorIdParamSchema };
