const jwt = require("jsonwebtoken");

/**
 * Authentication middleware
 * - Cookie-based JWT
 * - Attaches req.user
 * - Safe for RBAC & enterprise APIs
 */
module.exports = function auth(req, res, next) {
  try {
    const token = req.cookies?.token;

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // ✅ Attach minimal trusted fields
    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
    };

    next();
  } catch (err) {
    console.error("❌ Auth failed:", err.message);
    return res.status(401).json({
      message: "Session expired or invalid token",
    });
  }
};
