export const getCurrentUser = () => {
  const user = localStorage.getItem("user");

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const hasRole = (roles: string[]) => {
  const user = getCurrentUser();

  if (!user) return false;

  return roles.includes(user.role);
};