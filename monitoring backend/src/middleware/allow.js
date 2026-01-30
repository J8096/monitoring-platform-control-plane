/**
 * Role-based access control middleware
 * Usage: allow("admin", "sre")
 */
module.exports = function allow(...roles) {
  return (req, res, next) => {
    // user injected by auth middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};
