
import { Search, Users } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  searchActive?: boolean;
  onAddUser?: () => void;
}

export default function EmptyState({
  title,
  description,
  searchActive = false,
  onAddUser,
}: EmptyStateProps) {
  const heading =
    title ??
    (searchActive ? "No matching users" : "No users yet");

  const message =
    description ??
    (searchActive
      ? "Try changing your search or filters."
      : "Add your first user to get started.");

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {searchActive ? (
          <Search size={28} />
        ) : (
          <Users size={28} />
        )}
      </div>

      <h3>{heading}</h3>
      <p>{message}</p>

      {!searchActive && onAddUser && (
        <button
          type="button"
          className="empty-state-button"
          onClick={onAddUser}
        >
          Add a User
        </button>
      )}
    </div>
  );
}
