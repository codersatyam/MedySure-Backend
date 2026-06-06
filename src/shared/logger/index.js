const winston = require('winston');
const path = require('path');
const config = require('../../config');

const SENSITIVE_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'ssn', 'credit_card', 'authorization'];

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  return sanitized;
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    if (info.meta) {
      info.meta = sanitizeData(info.meta);
    }
    return info;
  })(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(sanitizeData(meta))}` : '';
    return `${timestamp} ${level}${reqId}: ${message}${metaStr}`;
  })
);

const transports = [];

if (config.env !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: config.isDev ? consoleFormat : logFormat,
    })
  );
}

if (config.isProd) {
  const logDir = path.resolve(config.logging.dir);
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
});

module.exports = logger;
