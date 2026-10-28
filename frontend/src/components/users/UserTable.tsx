
import type { User } from "../../types/user.types";
import UserRow from "./UserRow";
import EmptyState from "./EmptyState";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortField = "name" | "age" | "is_active" | "joined_date";
type SortDirection = "asc" | "desc";

interface UserTableProps {
  users: User[];
  selectedUsers: number[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelect: (userId: number) => void;
  onToggleSelectAll: () => void;
  onAddUser: () => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  loading?: boolean;
  onView?: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserTable({
  users,
  selectedUsers,
  allSelected,
  someSelected,
  onToggleSelect,
  onToggleSelectAll,
  onAddUser,
  sortField,
  sortDirection,
  onSort,
  loading = false,
  onView,
  onEdit,
  onDelete,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="table-loading" role="status">
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="Try changing your search or filters."
        searchActive
        onAddUser={onAddUser}
      />
    );
  }

  return (
    <div className="user-table-wrapper">
      <table className="user-table">
          <thead>
            <tr>
              <th className="selection-cell">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="Select all visible users"
                />
              </th>
              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() => onSort("name")}
                >
                  Employee
                  {sortField === "name" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={13} aria-hidden="true" />
                    ) : (
                      <ArrowDown size={13} aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown size={13} aria-hidden="true" />
                  )}
                </button>
              </th>
              <th>Department</th>
              <th>City</th>
              <th>Address</th>
              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() => onSort("joined_date")}
                >
                  Joined Date
                  {sortField === "joined_date" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={13} aria-hidden="true" />
                    ) : (
                      <ArrowDown size={13} aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown size={13} aria-hidden="true" />
                  )}
                </button>
              </th>
              <th>Gender</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                selected={selectedUsers.includes(user.id)}
                onSelect={onToggleSelect}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
      </table>
    </div>
  );
}
