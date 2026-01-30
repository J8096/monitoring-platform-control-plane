const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // per IP
  standardHeaders: true,
  legacyHeaders: false,
});
