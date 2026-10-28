import { useCallback, useEffect, useState } from "react";
import type { User } from "../src/types/user.types";

const API_URL = "http://localhost:5000";

interface LegacyFileReference {
  file_path: string;
}

interface LegacyUser extends Omit<User, "profile_picture" | "document"> {
  profile_picture?: string | LegacyFileReference | null;
  document?: string | LegacyFileReference | null;
}

interface UsersPageProps {
  onEditUser?: (user: LegacyUser) => void;
}

interface DeleteErrorResponse {
  error?: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function UsersPage({ onEditUser }: UsersPageProps) {
  const [users, setUsers] = useState<LegacyUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH USERS
  const fetchUsers = useCallback(async () => {
    const response = await fetch(`${API_URL}/users`);

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return (await response.json()) as LegacyUser[];
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError("");

    fetchUsers()
      .then((data) => {
        console.log("✅ USERS FROM API:", data);
        setUsers(data);
      })
      .catch((err: unknown) => {
        console.error("❌ FETCH USERS ERROR:", err);
        setError(getErrorMessage(err, "Failed to load users"));
      })
      .finally(() => setLoading(false));
  }, [fetchUsers]);

  useEffect(() => {
    let isCurrent = true;

    fetchUsers()
      .then((data) => {
        if (isCurrent) {
          console.log("✅ USERS FROM API:", data);
          setUsers(data);
        }
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          console.error("❌ FETCH USERS ERROR:", err);
          setError(getErrorMessage(err, "Failed to load users"));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchUsers]);

  // PROFILE PICTURE URL

  const getProfilePictureUrl = (user: LegacyUser): string | null => {
    const profilePicture = user?.profile_picture;

    if (!profilePicture) {
      return null;
    }

    // New normalized file object
    if (typeof profilePicture === "object" && profilePicture.file_path) {
      const filePath = profilePicture.file_path;

      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
      }

      return `${API_URL}${filePath}`;
    }

    // Old/string format

    if (typeof profilePicture === "string") {
      if (
        profilePicture.startsWith("http://") ||
        profilePicture.startsWith("https://")
      ) {
        return profilePicture;
      }

      return `${API_URL}${profilePicture}`;
    }

    return null;
  };

  // DOCUMENT URL
  const getDocumentUrl = (user: LegacyUser): string | null => {
    const document = user?.document;

    if (!document) {
      return null;
    }

    if (typeof document === "object" && document.file_path) {
      const filePath = document.file_path;

      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
      }

      return `${API_URL}${filePath}`;
    }

    if (typeof document === "string") {
      if (document.startsWith("http://") || document.startsWith("https://")) {
        return document;
      }

      return `${API_URL}${document}`;
    }

    return null;
  };

  // SELECT SINGLE USER

  const handleSelectUser = (userId: number) => {
    setSelectedUsers((previous) => {
      if (previous.includes(userId)) {
        return previous.filter((id) => id !== userId);
      }

      return [...previous, userId];
    });
  };

  // SELECT ALL

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  // DELETE USER

  const handleDeleteUser = async (userId: number): Promise<void> => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as DeleteErrorResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((previous) => previous.filter((user) => user.id !== userId));

      setSelectedUsers((previous) => previous.filter((id) => id !== userId));

      console.log("✅ User deleted");
    } catch (err: unknown) {
      console.error("❌ DELETE USER ERROR:", err);

      alert(getErrorMessage(err, "Failed to delete user"));
    }
  };

  // BULK DELETE

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedUsers.length === 0) {
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const response = await fetch(`${API_URL}/users/${userId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error(`Failed to delete user ${userId}`);
          }
        }),
      );

      setUsers((previous) =>
        previous.filter((user) => !selectedUsers.includes(user.id)),
      );

      setSelectedUsers([]);

      console.log("✅ Selected users deleted");
    } catch (err: unknown) {
      console.error("❌ BULK DELETE ERROR:", err);

      alert(getErrorMessage(err, "Failed to delete selected users"));

      handleRefresh();
    }
  };

  // EDIT USER
  const handleEditUser = (user: LegacyUser): void => {
    if (onEditUser) {
      onEditUser(user);
    }
  };

  // FORMAT DATE

  const formatDate = (
    dateValue: string | null | undefined,
  ): string => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // LOADING

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-container">Loading users...</div>
      </div>
    );
  }

  // ERROR

  if (error) {
    return (
      <div className="users-page">
        <div className="error-container">
          <p>❌ {error}</p>

          <button type="button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // RENDER

  return (
    <div className="users-page">
      {/* 
          HEADER
       */}

      <div className="users-header">
        <div>
          <h1>Users</h1>

          <p>Manage all registered users</p>
        </div>

        <div className="users-header-actions">
          {selectedUsers.length > 0 && (
            <button
              type="button"
              className="bulk-delete-btn"
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedUsers.length})
            </button>
          )}

          <button type="button" className="refresh-btn" onClick={handleRefresh}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* 
          TABLE
       */}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              {/* SELECT */}

              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={
                    users.length > 0 && selectedUsers.length === users.length
                  }
                  onChange={handleSelectAll}
                />
              </th>

              {/* PROFILE */}

              <th>Profile</th>

              {/* NAME */}

              <th>Name</th>

              {/* EMAIL */}

              <th>Email</th>

              {/* AGE */}

              <th>Age</th>

              {/* GENDER */}

              <th>Gender</th>

              {/* DEPARTMENT */}

              <th>Department</th>

              {/* CITY */}

              <th>City</th>

              {/* ADDRESS */}

              <th>Address</th>

              {/* JOINED DATE */}

              <th>Joined Date</th>

              {/* DOCUMENT */}

              <th>Document</th>

              {/* STATUS */}

              <th>Status</th>

              {/* ACTIONS */}

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={14} className="no-users">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const profilePictureUrl = getProfilePictureUrl(user);

                const documentUrl = getDocumentUrl(user);

                // DEBUG
                console.log(
                  `👤 ${user.name} profile picture:`,
                  profilePictureUrl,
                );

                return (
                  <tr key={user.id}>
                    {/* 
                        CHECKBOX
                     */}

                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>

                    {/*
                        PROFILE PICTURE
                     */}

                    <td>
                      <div className="profile-avatar">
                        {profilePictureUrl ? (
                          <img
                            src={profilePictureUrl}
                            alt={`${user.name} profile`}
                            className="profile-image"
                            onLoad={() => {
                              console.log(
                                "✅ Profile picture loaded:",
                                profilePictureUrl,
                              );
                            }}
                            onError={(event) => {
                              console.error(
                                "❌ Failed to load profile picture:",
                                profilePictureUrl,
                              );

                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.parentElement?.querySelector<HTMLElement>(
                                  ".avatar-fallback",
                                );

                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}

                        {/* FALLBACK INITIAL */}

                        <div
                          className="avatar-fallback"
                          style={{
                            display: profilePictureUrl ? "none" : "flex",
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </td>

                    {/*
                        NAME
                     */}

                    <td>
                      <div className="user-name-cell">
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>

                    {/*
                        EMAIL
                     */}

                    <td>{user.email || "-"}</td>

                    {/*
                        AGE
                     */}

                    <td>{user.age || "-"}</td>

                    {/* 
                        GENDER
                     */}

                    <td>{user.gender || "-"}</td>

                    {/* 
                        DEPARTMENT
                     */}

                    <td>{user.department_name || "-"}</td>

                    {/*
                        CITY
                     */}

                    <td>{user.city || "-"}</td>

                    {/* 
                        ADDRESS
                     */}

                    <td>
                      <div
                        className="user-address"
                        dangerouslySetInnerHTML={{
                          __html: user.address || "-",
                        }}
                      />
                    </td>

                    {/*
                        JOINED DATE
                     */}

                    <td>{formatDate(user.joined_date)}</td>

                    {/* 
                        DOCUMENT
                    */}

                    <td>
                      {documentUrl ? (
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-link"
                        >
                          📄 View
                        </a>
                      ) : (
                        <span className="no-document">No document</span>
                      )}
                    </td>

                    {/* 
                        STATUS
                     */}

                    <td>
                      {user.is_active ? (
                        <span className="status active">Active</span>
                      ) : (
                        <span className="status inactive">Inactive</span>
                      )}
                    </td>

                    {/* 
                        ACTIONS
                     */}

                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
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
    </div>
  );
}

export default UsersPage;
