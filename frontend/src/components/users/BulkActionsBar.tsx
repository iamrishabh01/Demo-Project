
import { Trash2, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  deleting?: boolean;
}

export default function BulkActionsBar({
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  deleting = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions-bar">
      <span>
        <strong>{selectedCount}</strong> user(s) selected
      </span>

      <div className="bulk-actions-buttons">
        <button
          type="button"
          className="bulk-delete-button"
          onClick={onDeleteSelected}
          disabled={deleting}
        >
          <Trash2 size={16} />
          {deleting ? "Deleting..." : "Delete selected"}
        </button>

        <button
          type="button"
          className="bulk-clear-button"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X size={16} />
          Clear
        </button>
      </div>
    </div>
  );
}
