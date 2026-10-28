
import { request } from "./apiClient";
import type { Department } from "../types";

export interface DepartmentInput {
  name: string;
  description?: string | null;
  is_active?: boolean | 0 | 1;
}

export interface DepartmentMutationResponse {
  message: string;
  department?: Department;
}

export async function getDepartments(): Promise<Department[]> {
  return request<Department[]>("/departments");
}

export async function getDepartmentById(
  id: number
): Promise<Department> {
  return request<Department>(`/departments/${id}`);
}

export async function createDepartment(
  data: DepartmentInput
): Promise<DepartmentMutationResponse> {
  return request<DepartmentMutationResponse>("/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(
  id: number,
  data: DepartmentInput
): Promise<DepartmentMutationResponse> {
  return request<DepartmentMutationResponse>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: number): Promise<void> {
  await request<unknown>(`/departments/${id}`, {
    method: "DELETE",
  });
}
