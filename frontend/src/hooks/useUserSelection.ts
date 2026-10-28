
import { useCallback, useMemo, useState } from "react";
import type { User } from "../types";

export default function useUserSelection(users: User[] = []) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const visibleUserIds = useMemo(
    () => users.map((user) => user.id),
    [users]
  );

  const toggleUser = useCallback((userId: number) => {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (visibleUserIds.length === 0) return;

    setSelectedUsers((current) => {
      const allVisibleSelected = visibleUserIds.every((id) =>
        current.includes(id)
      );

      if (allVisibleSelected) {
        return current.filter((id) => !visibleUserIds.includes(id));
      }

      return [...new Set([...current, ...visibleUserIds])];
    });
  }, [visibleUserIds]);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const isSelected = useCallback(
    (userId: number) => selectedUsers.includes(userId),
    [selectedUsers]
  );

  const allSelected = useMemo(
    () =>
      visibleUserIds.length > 0 &&
      visibleUserIds.every((id) => selectedUsers.includes(id)),
    [visibleUserIds, selectedUsers]
  );

  const selectedVisibleCount = useMemo(
    () =>
      visibleUserIds.filter((id) => selectedUsers.includes(id)).length,
    [visibleUserIds, selectedUsers]
  );

  const someSelected =
    selectedVisibleCount > 0 && !allSelected;

  return {
    selectedUsers,
    setSelectedUsers,
    visibleUserIds,
    toggleUser,
    toggleSelectAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    selectedVisibleCount,
  };
}
