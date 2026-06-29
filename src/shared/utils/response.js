// Standard success-response helpers.
// Mirrors the error handler's envelope: { success: false, error: {...} }
// so every response shares the same shape: { success: true, data: {...} }.

const sendSuccess = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

const sendCreated = (res, data = null) => sendSuccess(res, data, 201);

module.exports = { sendSuccess, sendCreated };
