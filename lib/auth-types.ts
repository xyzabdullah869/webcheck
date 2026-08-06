export type UserRole = 'student' | 'instructor' | 'admin' | 'owner';

export type AuthSession = {
  user: {
    id: string;
    email: string;
  } | null;
  role: UserRole | null;
};

export const roleHierarchy: Record<UserRole, number> = {
  student: 1,
  instructor: 2,
  admin: 3,
  owner: 4,
};

export function hasMinRole(current: UserRole | null, required: UserRole): boolean {
  if (!current) return false;
  return roleHierarchy[current] >= roleHierarchy[required];
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'instructor':
      return 'Instructor';
    case 'student':
      return 'Student';
    default:
      return 'Student';
  };
}
