
import { useMemo, useState } from "react";
import { X } from "lucide-react";

import type { User } from "../types";

import useUsers from "../hooks/useUsers";
import useUserSelection from "../hooks/useUserSelection";

import {
  createUser,
  updateUser,
} from "../services/userService";

import UsersToolbar from "../components/users/UsersToolbar";
import UserForm from "../components/users/UserForm";
import UserTable from "../components/users/UserTable";
import BulkActionsBar from "../components/users/BulkActionsBar";

import type {
  SortField,
  SortDirection,
} from "../components/users/UserTable";

import "./UsersPage.scss";

export default function UsersPage() {
  // --------------------------------------------------
  // USERS AND API STATE
  // --------------------------------------------------

  const {
    users,
    loading,
    error,
    refreshUsers,
    removeUser,
    removeUsers,
  } = useUsers();

  // --------------------------------------------------
  // USER SELECTION STATE
  // --------------------------------------------------

  const {
    selectedUsers,
    toggleUser,
    setSelectedUsers,
    clearSelection,
  } = useUserSelection(users);

  // --------------------------------------------------
  // PAGE STATE
  // --------------------------------------------------

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [saving, setSaving] = useState<boolean>(false);

  const [pageError, setPageError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState<string>("");

  const [sortField, setSortField] = useState<SortField>("name");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  // --------------------------------------------------
  // SEARCH AND SORT
  // --------------------------------------------------

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
          (Number.isNaN(leftDate)
            ? Number.NEGATIVE_INFINITY
            : leftDate) -
          (Number.isNaN(rightDate)
            ? Number.NEGATIVE_INFINITY
            : rightDate);
      } else {
        comparison = left.name.localeCompare(
          right.name,
          undefined,
          {
            sensitivity: "base",
            numeric: true,
          },
        );
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [search, sortDirection, sortField, users]);

  // --------------------------------------------------
  // VISIBLE SELECTION
  // --------------------------------------------------

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) =>
      selectedUsers.includes(user.id),
    );

  const someVisibleSelected =
    filteredUsers.some((user) =>
      selectedUsers.includes(user.id),
    ) && !allVisibleSelected;

  // --------------------------------------------------
  // OPEN ADD / EDIT FORM
  // --------------------------------------------------

  function handleAddUser(): void {
    setEditingUser(null);
    setPageError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function handleEditUser(user: User): void {
    setEditingUser(user);
    setPageError(null);
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function handleCloseForm(): void {
    if (saving) return;

    setIsFormOpen(false);
    setEditingUser(null);
  }

  // --------------------------------------------------
  // SORTING
  // --------------------------------------------------

  function handleSort(field: SortField): void {
    if (field === sortField) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );

      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  // --------------------------------------------------
  // SELECT ALL VISIBLE USERS
  // --------------------------------------------------

  function handleToggleAllVisible(): void {
    const visibleIds = filteredUsers.map((user) => user.id);

    setSelectedUsers((current) => {
      if (allVisibleSelected) {
        return current.filter(
          (id) => !visibleIds.includes(id),
        );
      }

      return [...new Set([...current, ...visibleIds])];
    });
  }

  // --------------------------------------------------
  // CREATE / UPDATE USER
  // --------------------------------------------------

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

  // --------------------------------------------------
  // DELETE ONE USER
  // --------------------------------------------------

  async function handleDeleteUser(user: User): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    );

    if (!confirmed) return;

    setPageError(null);
    setSuccessMessage(null);

    try {
      await removeUser(user.id);

      setSelectedUsers((current) =>
        current.filter((id) => id !== user.id),
      );

      setSuccessMessage("User deleted successfully.");
    } catch (err: unknown) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to delete the user.",
      );
    }
  }

  // --------------------------------------------------
  // BULK DELETE
  // --------------------------------------------------

  async function handleDeleteSelected(): Promise<void> {
    if (selectedUsers.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUsers.length} selected user(s)?`,
    );

    if (!confirmed) return;

    setPageError(null);
    setSuccessMessage(null);

    try {
      const count = selectedUsers.length;

      await removeUsers(selectedUsers);
      clearSelection();

      setSuccessMessage(
        `${count} selected user(s) deleted successfully.`,
      );
    } catch (err: unknown) {
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to delete the selected users.",
      );
    }
  }

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <div className="users-page">
      {/* Header, search, refresh and add-user action */}
      <UsersToolbar
        search={search}
        onSearchChange={setSearch}
        onAddUser={handleAddUser}
        onRefresh={() => void refreshUsers()}
        loading={loading}
        saving={saving}
      />

      {/* Page-level error */}
      {pageError && (
        <div className="users-page__error" role="alert">
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

      {/* Success feedback */}
      {successMessage && (
        <div className="users-page__success" role="status">
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Fetching errors */}
      {error && (
        <div className="users-page__error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void refreshUsers()}
            disabled={loading}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bulk selection actions */}
      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onDeleteSelected={() => void handleDeleteSelected()}
        onClearSelection={clearSelection}
        deleting={saving}
      />

      {/* Users table */}
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

      {/* Add / Edit user modal */}
      {isFormOpen && (
        <div
          className="users-page__overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              handleCloseForm();
            }
          }}
        >
          <section
            className="users-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-dialog-title"
          >
            <div className="users-page__modal-header">
              <div>
                <span className="users-page__modal-eyebrow">
                  USER MANAGEMENT
                </span>

                <h2 id="user-form-dialog-title">
                  {editingUser ? "Edit User" : "Add a User"}
                </h2>
              </div>

              <button
                type="button"
                className="users-page__close-button"
                onClick={handleCloseForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="users-page__modal-content">
              <UserForm
                user={editingUser}
                onSubmit={handleSaveUser}
                onCancel={handleCloseForm}
                submitting={saving}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
