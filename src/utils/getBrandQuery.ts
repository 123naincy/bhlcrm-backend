const ADMIN_ROLES = [
  "super_admin",
  "admin",
];

export function isAdminRole(role?: string) {
  return ADMIN_ROLES.includes(role || "");
}

export function getBrandQuery(user: {
  role?: string;
  brandId?: string;
  userId?: string;
}) {
  if (isAdminRole(user.role)) {
    return {};
  }

  const brandId =
    user.brandId || user.userId;

  return brandId ? { brandId } : {};
}

export function getBrandId(user: {
  brandId?: string;
  userId?: string;
}) {
  return user.brandId || user.userId;
}
