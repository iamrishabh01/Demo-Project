
import type { User } from "../types";
import UserList from "../components/users/UserList";
import useUserSelection from "../hooks/useUserSelection";

interface HomeProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onAddUser: () => void;
  onDelete: (id: number) => void | Promise<void>;
  onEdit: (user: User) => void;
}

export default function HomePage({
  users,
  loading,
  error,
  onAddUser,
  onDelete,
  onEdit,
}: HomeProps) {
  const { selectedUsers, toggleUser, toggleSelectAll } =
    useUserSelection(users);

  return (
    <main className="home-page">
      <header className="home-header">
        <div>
          <h1>All Users</h1>
          <p className="subtitle">
            View and manage all registered users
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary add-user-button"
          onClick={onAddUser}
        >
          + Add a User
        </button>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="users-section" aria-label="Users">
        {loading ? (
          <p className="loading" role="status">
            Loading users...
          </p>
        ) : (
          <UserList
            users={users}
            selectedUsers={selectedUsers}
            onToggleUser={toggleUser}
            onToggleAll={toggleSelectAll}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </section>
    </main>
  );
}
