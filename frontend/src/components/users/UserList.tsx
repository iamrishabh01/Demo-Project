
import { useState } from "react";
import { Pencil, Trash2, FileText } from "lucide-react";
import type { User } from "../../types";
import { getFileUrl } from "../../utils/fileUtils";

interface UserFileReference {
  file_path?: string | null;
  original_name?: string | null;
  stored_name?: string | null;
}

interface UserListProps {
  users: User[];
  selectedUsers: number[];
  onToggleUser: (id: number) => void;
  onToggleAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  deletingUserId?: number | null;
}

function getFileReference(
  value: string | UserFileReference | null | undefined,
): string | null {
  if (typeof value === "string") return value;
  return value?.file_path ?? null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";

  // A SQL DATE often arrives as YYYY-MM-DD or an ISO timestamp.
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function UserList({
  users,
  selectedUsers,
  onToggleUser,
  onToggleAll,
  onEdit,
  onDelete,
  deletingUserId = null,
}: UserListProps) {
  const [failedImages, setFailedImages] = useState<number[]>([]);

  const allSelected =
    users.length > 0 &&
    users.every((user) => selectedUsers.includes(user.id));

  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                aria-label="Select all visible users"
                checked={allSelected}
                onChange={onToggleAll}
              />
            </th>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Department</th>
            <th>City</th>
            <th>Address</th>
            <th>Joined Date</th>
            <th>Document</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={13} className="no-users">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const picturePath = getFileReference(
                user.profile_picture as
                  | string
                  | UserFileReference
                  | null
                  | undefined,
              );

              const documentPath = getFileReference(
                user.document as
                  | string
                  | UserFileReference
                  | null
                  | undefined,
              );

              const pictureUrl = picturePath
                ? getFileUrl(picturePath)
                : null;

              const documentUrl = documentPath
                ? getFileUrl(documentPath)
                : null;

              const showPicture =
                Boolean(pictureUrl) &&
                !failedImages.includes(user.id);

              return (
                <tr key={user.id}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      aria-label={`Select ${user.name}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => onToggleUser(user.id)}
                    />
                  </td>

                  <td>
                    <div className="profile-avatar">
                      {showPicture && pictureUrl ? (
                        <img
                          src={pictureUrl}
                          alt={`${user.name} profile`}
                          className="profile-image"
                          onError={() =>
                            setFailedImages((current) =>
                              current.includes(user.id)
                                ? current
                                : [...current, user.id],
                            )
                          }
                        />
                      ) : null}

                      {!showPicture && (
                        <div className="avatar-fallback">
                          {user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="user-name-cell">
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>

                  <td>{user.email || "-"}</td>
                  <td>{user.age ?? "-"}</td>
                  <td>{user.gender || "-"}</td>
                  <td>{user.department_name || "-"}</td>
                  <td>{user.city || "-"}</td>

                  <td>
                    <div
                      className="user-address"
                      // Only render HTML that has been sanitized by the backend.
                      dangerouslySetInnerHTML={{
                        __html: user.address || "-",
                      }}
                    />
                  </td>

                  <td>{formatDate(user.joined_date)}</td>

                  <td>
                    {documentUrl ? (
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        <FileText size={15} aria-hidden="true" />
                        View
                      </a>
                    ) : (
                      <span className="no-document">No document</span>
                    )}
                  </td>

                  <td>
                    {user.is_active ? (
                      <span className="status active">Active</span>
                    ) : (
                      <span className="status inactive">Inactive</span>
                    )}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => onEdit(user)}
                        aria-label={`Edit ${user.name}`}
                        title="Edit user"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => onDelete(user.id)}
                        disabled={deletingUserId === user.id}
                        aria-label={`Delete ${user.name}`}
                        title="Delete user"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
