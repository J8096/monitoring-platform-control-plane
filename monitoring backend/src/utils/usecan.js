export function useCan(user, roles = []) {
  if (!user) return false;
  return roles.includes(user.role);
}
