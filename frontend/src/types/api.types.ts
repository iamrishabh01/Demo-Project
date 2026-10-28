import type { User } from "./user.types";

export interface UserMutationResponse {
  message: string;
  user: User;
}

export interface BulkDeleteResponse {
  message: string;
  deletedCount?: number;
  deletedIds?: number[];
}
