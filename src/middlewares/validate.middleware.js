const { ValidationError } = require('../shared/errors');

const validate = (schema, property = 'body') => {
  return (req, _res, next) => {
    const dataToValidate = req[property];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));
      return next(new ValidationError('Validation failed', details));
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
