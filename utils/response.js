// Placeholder function for sendErrorToSlack
const sendErrorToSlack = (err) => {
  console.log('Error would be sent to Slack:', err);
};

// For successful responses
const successResponse = (message, data = null) => {
  return { success: true, message, data };
};

const sendError = (res, message, statusCode) => {
  const err = { message, statusCode };

  console.log('Error:', message);

  sendErrorToSlack(err);

  // Set proper content type header
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json(errorResponse(message));
};

// For error responses
const errorResponse = (message) => {
  return { success: false, message };
};

module.exports = {
  successResponse,
  sendError,
  errorResponse,
};