
import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search, X } from "lucide-react";

import type { User } from "../types";
import useUsers from "../hooks/useUsers";
import useUserSelection from "../hooks/useUserSelection";
import { createUser, updateUser } from "../services/userService";

import UserForm from "../components/users/UserForm";
import BulkActionsBar from "../components/users/BulkActionsBar";
import UserTable from "../components/users/UserTable";

import "./UsersPage.css";

type SortField = "name" | "age" | "is_active" | "joined_date";
type SortDirection = "asc" | "desc";

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    refreshUsers,
    removeUser,
    removeUsers,
  } = useUsers();

  const {
    selectedUsers,
    toggleUser,
    setSelectedUsers,
    clearSelection,
  } = useUserSelection(users);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matchingUsers = query
      ? users.filter((user) =>
          [
            user.name,
            user.email,
            user.city,
            user.department_name,
            user.gender,
            user.address,
          ].some((value) =>
            value?.toLocaleLowerCase().includes(query),
          ),
        )
      : users;

    return [...matchingUsers].sort((left, right) => {
      let comparison: number;

      if (sortField === "age") {
        comparison =
          (left.age ?? Number.NEGATIVE_INFINITY) -
          (right.age ?? Number.NEGATIVE_INFINITY);
      } else if (sortField === "is_active") {
        comparison =
          Number(Boolean(left.is_active)) -
          Number(Boolean(right.is_active));
      } else if (sortField === "joined_date") {
        const leftDate = Date.parse(left.joined_date ?? "");
        const rightDate = Date.parse(right.joined_date ?? "");
        comparison =
          (Number.isNaN(leftDate) ? Number.NEGATIVE_INFINITY : leftDate) -
          (Number.isNaN(rightDate) ? Number.NEGATIVE_INFINITY : rightDate);
      } else {
        comparison = left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [search, sortDirection, sortField, users]);

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUsers.includes(user.id));
  const someVisibleSelected =
    filteredUsers.some((user) => selectedUsers.includes(user.id)) &&
    !allVisibleSelected;

  function handleAddUser() {
    setEditingUser(null);
    setPageError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function handleEditUser(user: User) {
    setEditingUser(user);
    setPageError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function handleToggleAllVisible() {
    const visibleIds = filteredUsers.map((user) => user.id);

    setSelectedUsers((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  }

  function handleCloseForm() {
    if (saving) return;

    setIsFormOpen(false);
    setEditingUser(null);
  }

  async function handleSaveUser(formData: FormData): Promise<void> {
    setSaving(true);
    setPageError(null);
    setSuccessMessage(null);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        setSuccessMessage("User updated successfully.");
      } else {
        await createUser(formData);
        setSuccessMessage("User created successfully.");
      }

      await refreshUsers();
      clearSelection();

      setIsFormOpen(false);
      setEditingUser(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save the user.";

      setPageError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(user: User): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    );

    if (!confirmed) return;

    setPageError(null);

    try {
      await removeUser(user.id);
      setSelectedUsers((current) =>
        current.filter((id) => id !== user.id),
      );
    } catch (err: unknown) {
      setPageError(
        err instanceof Error ? err.message : "Unable to delete the user.",
      );
    }
  }

  async function handleDeleteSelected(): Promise<void> {
    if (selectedUsers.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUsers.length} selected user(s)?`,
    );

    if (!confirmed) return;

    setPageError(null);

    try {
      await removeUsers(selectedUsers);
      clearSelection();
    } catch (err: unknown) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to delete the selected users.",
      );
    }
  }

  return (
    <div className="users-page">
      <header className="users-page-header">
        <div>
          <span className="page-eyebrow">USER MANAGEMENT</span>
          <h1>All Users</h1>
          <p>Manage users, departments, account status and documents.</p>
        </div>

        <div className="users-header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handleAddUser}
            disabled={saving}
          >
            <Plus size={18} />
            Add a User
          </button>
        </div>
      </header>

      {pageError && (
        <div className="page-error" role="alert">
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => setPageError(null)}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="status">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="page-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refreshUsers()}>
            Try Again
          </button>
        </div>
      )}

      <div className="users-toolbar">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search users"
          />
        </label>

        <button
          type="button"
          className="refresh-button"
          onClick={() => void refreshUsers()}
          disabled={loading || saving}
        >
          <RefreshCw
            size={16}
            className={loading ? "refresh-spinning" : undefined}
          />
          Refresh
        </button>
      </div>

      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onDeleteSelected={() => void handleDeleteSelected()}
        onClearSelection={clearSelection}
        deleting={saving}
      />

      <UserTable
        users={filteredUsers}
        selectedUsers={selectedUsers}
        allSelected={allVisibleSelected}
        someSelected={someVisibleSelected}
        onToggleSelect={toggleUser}
        onToggleSelectAll={handleToggleAllVisible}
        onEdit={handleEditUser}
        onDelete={(user: User) => void handleDeleteUser(user)}
        onAddUser={handleAddUser}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        loading={loading}
      />

      {isFormOpen && (
        <div
          className="user-form-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              handleCloseForm();
            }
          }}
        >
          <section
            className="user-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-dialog-title"
          >
            <div className="user-form-modal-heading">
              <h2 id="user-form-dialog-title">
                {editingUser ? "Edit User" : "Add a User"}
              </h2>

              <button
                type="button"
                className="form-close-button"
                onClick={handleCloseForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <UserForm
              user={editingUser}
              onSubmit={handleSaveUser}
              onCancel={handleCloseForm}
              submitting={saving}
            />
          </section>
        </div>
      )}
    </div>
  );
}
