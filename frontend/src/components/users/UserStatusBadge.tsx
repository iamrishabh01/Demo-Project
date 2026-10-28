
import type { User } from "../../types/user.types";

interface UserStatusBadgeProps {
  isActive: User["is_active"];
}

export default function UserStatusBadge({
  isActive,
}: UserStatusBadgeProps) {
  const active =
    isActive === true ||
    isActive === 1;

  return (
    <span
      className={`user-status-badge ${
        active ? "status-active" : "status-inactive"
      }`}
    >
      <span className="status-dot" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
