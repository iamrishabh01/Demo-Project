
import type { User } from "../../types";

export interface UserFileReference {
  file_path?: string | null;
  original_name?: string | null;
  stored_name?: string | null;
}

export interface UserListProps {
  users: User[];
  selectedUsers: number[];

  onToggleUser: (id: number) => void;
  onToggleAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;

  deletingUserId?: number | null;
}

export interface UserListState {
  failedImages: number[];
  markImageAsFailed: (userId: number) => void;
}
