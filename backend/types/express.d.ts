
import type { Request } from "express";
import type { AuthenticatedUser } from "./auth";

export interface ValidatedUser {
  name: string;
  email: string;
  age: number | null;
  city: string | null;
  joined_date: string | null;
  gender: "Male" | "Female" | "Other" | null;
  department_id: number | null;
  is_active: 0 | 1;
  address: string | null;
}

export interface ValidatedDepartment {
  name: string;
  description: string | null;
  is_active: 0 | 1;
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userIds?: number[];
      departmentId?: number;
      validatedUser?: ValidatedUser;
      validatedDepartment?: ValidatedDepartment;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export {};