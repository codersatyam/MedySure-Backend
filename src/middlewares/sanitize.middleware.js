const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Strip common XSS patterns
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeData(value);
  }
  return value;
};

const sanitizeData = (data) => {
  if (Array.isArray(data)) {
    return data.map(sanitizeValue);
  }
  if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const [key, val] of Object.entries(data)) {
      // Strip keys containing $ or . (NoSQL injection patterns)
      const cleanKey = key.replace(/[$.]/, '');
      result[cleanKey] = sanitizeValue(val);
    }
    return result;
  }
  return data;
};

const sanitizeMiddleware = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeData(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeData(req.params);
  }
  next();
};

module.exports = sanitizeMiddleware;
