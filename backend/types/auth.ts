export type UserRole = "Admin" | "Employee" | "Guest";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  employeeId: number | null;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  employeeId: number | null;
}

export interface LoginInput {
  email: string;
  password: string;
}