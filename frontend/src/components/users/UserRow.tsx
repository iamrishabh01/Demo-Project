
import type { User } from "../../types/user.types";
import UserActions from "./UserActions";
import UserStatusBadge from "./UserStatusBadge";
import GenderBadge from "./GenderBadge";
import { getFileUrl } from "../../utils/fileUtils";

interface UserRowProps {
  user: User;
  selected: boolean;
  onSelect: (userId: number, checked: boolean) => void;
  onView?: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  deleting?: boolean;
}

export default function UserRow({
  user,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  deleting = false,
}: UserRowProps) {
  const profilePicturePath =
    user.profile_picture ||
    user.files?.find((file) => file.file_type === "profile_picture")
      ?.file_path;
  const profilePictureUrl = profilePicturePath
    ? getFileUrl(profilePicturePath)
    : null;

  return (
    <tr className={selected ? "user-row-selected" : undefined}>
      <td className="selection-cell">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) =>
            onSelect(user.id, event.target.checked)
          }
          aria-label={`Select ${user.name}`}
        />
      </td>

      <td>
        <div className="user-identity">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={`${user.name} profile`}
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar user-avatar-fallback">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}

          <div className="user-identity-details">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
      </td>

      <td>{user.department_name || "—"}</td>
      <td>{user.city || "—"}</td>
      <td className="address-cell">
        <div
          className="address-content"
          dangerouslySetInnerHTML={{
            __html: user.address || "—",
          }}
        />
      </td>
      <td>
        {user.joined_date
          ? new Date(user.joined_date).toLocaleDateString("en-IN")
          : "—"}
      </td>
      <td>
        <GenderBadge gender={user.gender} />
      </td>
      <td>
        <UserStatusBadge isActive={user.is_active} />
      </td>
      <td className="actions-cell">
        <UserActions
          onView={onView ? () => onView(user) : undefined}
          onEdit={() => onEdit(user)}
          onDelete={() => onDelete(user)}
          deleting={deleting}
        />
      </td>
    </tr>
  );
}
