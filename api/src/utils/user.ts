export enum USER_ROLE {
  PATIENT = "patient",
  DOCTOR = "medecin",
  ADMIN = "admin",
}

export const USER_AVAILABLES_ROLES = [
  USER_ROLE.PATIENT,
  USER_ROLE.DOCTOR,
  USER_ROLE.ADMIN,
] as const;

export type UserRole = (typeof USER_AVAILABLES_ROLES)[number];

export const getUserIdFromContext = (c: any): string | null => {
  const user = c.get("user");
  if (!user || !user.userId) {
    return null;
  }
  return user.userId;
};

export const canDeleteUser = (role: UserRole): boolean => {
  return role === USER_ROLE.ADMIN;
};

export const canDeleteDoctor = (role: UserRole, doctorId: string, userId: string): boolean => {
  return role === USER_ROLE.ADMIN || (role === USER_ROLE.DOCTOR && doctorId === userId);
};

export const canUpdateDoctor = (role: UserRole, doctorId: string, userId: string): boolean => {
  return role === USER_ROLE.ADMIN || (role === USER_ROLE.DOCTOR && doctorId === userId);
};
