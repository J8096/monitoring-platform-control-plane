/**
 * Checks if a user has one of the allowed roles.
 * Used server-side in middleware and service logic.
 *
 * @param {Object} user - { role: string }
 * @param {string[]} roles - allowed roles
 * @returns {boolean}
 */
function canAccess(user, roles = []) {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}

module.exports = { canAccess };
