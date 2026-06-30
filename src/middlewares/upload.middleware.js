const multer = require('multer');
const { AppError } = require('../shared/errors');

// Reusable single-image upload middleware. Keeps the file in memory (as a
// Buffer) so it can be streamed straight to object storage, and converts
// multer's errors into AppErrors so the global error handler returns 400s
// instead of 500s.
const createImageUpload = ({ field, maxBytes, allowedMimes }) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        return cb(null, true);
      }
      // Flag the rejection so we can map it to a clear 400 below.
      const err = new Error('Unsupported file type');
      err.code = 'UNSUPPORTED_FILE_TYPE';
      return cb(err);
    },
  }).single(field);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (!err) {
        return next();
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Photo must be less than 2MB', 400, 'FILE_TOO_LARGE'));
      }
      if (err.code === 'UNSUPPORTED_FILE_TYPE') {
        return next(
          new AppError('Unsupported file type. Allowed: jpeg, png, webp', 400, 'UNSUPPORTED_FILE_TYPE')
        );
      }
      return next(new AppError('File upload failed', 400, 'UPLOAD_FAILED'));
    });
  };
};

module.exports = { createImageUpload };
