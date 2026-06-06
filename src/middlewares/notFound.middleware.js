const { NotFoundError } = require('../shared/errors');

const notFoundHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundHandler;
