import UserList from "../src/components/users/UserList";
import useUserSelection from "../src/hooks/useUserSelection";
import type { User } from "../src/types/user.types";

interface HomeProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onAddUser: () => void;
  onDelete: (id: number) => void | Promise<void>;
  onEdit: (user: User) => void;
}

export default function Home({
  users,
  loading,
  error,
  onAddUser,
  onDelete,
  onEdit,
}: HomeProps) {
  const {
    selectedUsers,
    toggleUser,
    toggleSelectAll,
  } = useUserSelection(users);

  return (
    <div className="home-page">
      <div className="home-header">
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
          Add a User
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          Error: {error}
        </div>
      )}

      <div className="users-section">
        {loading ? (
          <div className="loading" role="status">
            Loading users...
          </div>
        ) : (
          <UserList
            users={users}
            selectedUsers={selectedUsers}
            onToggleUser={toggleUser}
            onToggleAll={toggleSelectAll}
            onDelete={(id) => void onDelete(id)}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}