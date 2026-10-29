
import { request } from "./apiClient";
import type { User } from "../types";
import type {
  BulkDeleteResponse,
  UserMutationResponse,
} from "../types/api.types";

export type { BulkDeleteResponse, UserMutationResponse } from "../types/api.types";

export async function getUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export async function getUserById(id: number): Promise<User> {
  return request<User>(`/users/${id}`);
}

export async function createUser(
  formData: FormData
): Promise<UserMutationResponse> {
  return request<UserMutationResponse>("/users", {
    method: "POST",
    body: formData,
  });
}

export async function updateUser(
  id: number,
  formData: FormData
): Promise<UserMutationResponse> {
  return request<UserMutationResponse>(`/users/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function deleteUser(id: number): Promise<void> {
  await request<unknown>(`/users/${id}`, {
    method: "DELETE",
  });
}

export async function deleteUsers(
  ids: number[]
): Promise<BulkDeleteResponse> {
  return request<BulkDeleteResponse>("/users/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
