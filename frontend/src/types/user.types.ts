
export type Gender = "Male" | "Female" | "Other";

export type UserStatus = "Active" | "Inactive";

export interface User {
  id: number;
  name: string;
  email: string;
  age: number | null;
  city: string | null;
  joined_date: string | null;
  is_active: boolean | 0 | 1;
  gender: Gender | null;
  department_id: number | null;
  department_name?: string | null;
  address: string | null;
  profile_picture?: string | null;
  document?: string | null;
  files?: UserFile[];
}

export interface UserFile {
  id: number;
  user_id: number;
  file_type: "profile_picture" | "document";
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

export interface UserFormData {
  name: string;
  email: string;
  age: number | null;
  city: string;
  joined_date: string;
  is_active: 0 | 1;
  gender: Gender | "";
  department_id: number | null;
  address: string;
}
