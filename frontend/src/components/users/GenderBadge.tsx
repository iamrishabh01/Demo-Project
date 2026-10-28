
import type { Gender } from "../../types/user.types";

interface GenderBadgeProps {
  gender: Gender | null | undefined;
}

export default function GenderBadge({
  gender,
}: GenderBadgeProps) {
  if (!gender) {
    return <span className="gender-badge gender-unknown">—</span>;
  }

  const className = gender.toLowerCase();

  return (
    <span className={`gender-badge gender-${className}`}>
      {gender}
    </span>
  );
}
