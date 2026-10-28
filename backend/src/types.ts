
export type Gender = "Male" | "Female" | "Other" | null;

export type UserInput = {
  name: string;
  email: string;
  age?: number | null;
  city?: string | null;
  joined_date?: string | null;
  is_active?: boolean | 0 | 1;
  gender?: Gender;
  department_id?: number | null;
  address?: string | null;
};

export type DepartmentInput = {
  name: string;
  description?: string | null;
  is_active?: boolean | 0 | 1;
};
