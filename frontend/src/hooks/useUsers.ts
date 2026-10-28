
import { useCallback, useEffect, useState } from "react";
import * as userService from "../services/userService";
import type { User } from "../types";

interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  removeUser: (id: number) => Promise<void>;
  removeUsers: (ids: number[]) => Promise<void>;
}

export default function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load users.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const removeUser = useCallback(
    async (id: number): Promise<void> => {
      await userService.deleteUser(id);
      setUsers((current) => current.filter((user) => user.id !== id));
    },
    []
  );

  const removeUsers = useCallback(
    async (ids: number[]): Promise<void> => {
      if (ids.length === 0) return;

      await userService.deleteUsers(ids);

      const deletedIds = new Set(ids);
      setUsers((current) =>
        current.filter((user) => !deletedIds.has(user.id))
      );
    },
    []
  );

  return {
    users,
    loading,
    error,
    refreshUsers,
    removeUser,
    removeUsers,
  };
}
