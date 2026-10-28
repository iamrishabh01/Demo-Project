
import { Eye, Pencil, Trash2 } from "lucide-react";

interface UserActionsProps {
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export default function UserActions({
  onView,
  onEdit,
  onDelete,
  deleting = false,
}: UserActionsProps) {
  return (
    <div className="user-actions">
      {onView && (
        <button
          type="button"
          className="icon-button view-button"
          onClick={onView}
          title="View user"
          aria-label="View user"
        >
          <Eye size={17} />
        </button>
      )}

      <button
        type="button"
        className="icon-button edit-button"
        onClick={onEdit}
        title="Edit user"
        aria-label="Edit user"
      >
        <Pencil size={17} />
      </button>

      <button
        type="button"
        className="icon-button delete-button"
        onClick={onDelete}
        disabled={deleting}
        title="Delete user"
        aria-label="Delete user"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
