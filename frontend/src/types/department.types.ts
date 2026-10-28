export interface Department {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean | 0 | 1;
}

export interface CreateDepartmentInput {
  name: string;
  description: string;
  is_active: boolean;
}
