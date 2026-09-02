// ==========================================
// User & Auth Types
// ==========================================

export const USER_ROLES = ['admin', 'manager', 'agent'] as const;
export type UserRole = typeof USER_ROLES[number];

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Safe user object without password_hash — used in API responses */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
}

/** Strips password_hash from a UserRow */
export function toSafeUser(user: UserRow): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}
