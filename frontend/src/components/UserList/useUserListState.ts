
import { useCallback, useState } from "react";
import type { UserListState } from "./UserList.types";

export default function useUserListState(): UserListState {
  const [failedImages, setFailedImages] = useState<number[]>([]);

  const markImageAsFailed = useCallback((userId: number): void => {
    setFailedImages((current) =>
      current.includes(userId)
        ? current
        : [...current, userId],
    );
  }, []);

  return {
    failedImages,
    markImageAsFailed,
  };
}
