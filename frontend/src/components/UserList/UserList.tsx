
import {
  Avatar,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  DescriptionOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@mui/icons-material";

import DOMPurify from "dompurify";

import type { User } from "../../types";
import { getFileUrl } from "../../utils/fileUtils";

import type {
  UserFileReference,
  UserListProps,
} from "./UserList.types";

import useUserListState from "./useUserListState";
import "./UserList.scss";

function getFileReference(
  value: string | UserFileReference | null | undefined,
): string | null {
  if (typeof value === "string") {
    return value || null;
  }

  return value?.file_path ?? null;
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "-";

  // Preserve SQL DATE values without timezone shifting.
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function UserList({
  users,
  selectedUsers,
  onToggleUser,
  onToggleAll,
  onEdit,
  onDelete,
  deletingUserId = null,
}: UserListProps) {
  const { failedImages, markImageAsFailed } =
    useUserListState();

  const allSelected =
    users.length > 0 &&
    users.every((user) => selectedUsers.includes(user.id));

  const someSelected =
    selectedUsers.some((id) =>
      users.some((user) => user.id === id),
    ) && !allSelected;

  return (
    <Paper className="user-list" elevation={0}>
      <TableContainer className="user-list__container">
        <Table
          stickyHeader
          aria-label="User management table"
          className="user-list__table"
        >
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                className="user-list__checkbox-cell"
              >
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAll}
                  disabled={users.length === 0}
                  slotProps={{
  input: {
    "aria-label": "Select all users",
  },
}}
                />
              </TableCell>

              <TableCell>Profile</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Joined Date</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="user-list__empty"
                >
                  <Typography variant="body2">
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
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

                const isSelected =
                  selectedUsers.includes(user.id);

                const isDeleting =
                  deletingUserId === user.id;

                // Sanitize rich-text HTML before rendering.
                const safeAddress = user.address
                  ? DOMPurify.sanitize(user.address)
                  : "";

                return (
                  <TableRow
                    hover
                    key={user.id}
                    selected={isSelected}
                    className="user-list__row"
                  >
                    <TableCell
                      padding="checkbox"
                      className="user-list__checkbox-cell"
                    >
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => onToggleUser(user.id)}
                        slotProps={{
  input: {
    "aria-label": `Select ${user.name}`,
  },
}}
                      />
                    </TableCell>

                    <TableCell>
                      <Avatar
                        src={
                          showPicture
                            ? pictureUrl ?? undefined
                            : undefined
                        }
                        alt={user.name}
                        className="user-avatar"
                        slotProps={{
                          img: {
                            onError: () => markImageAsFailed(user.id),
                          },
                        }}
                      >
                        {getInitials(user.name)}
                      </Avatar>
                    </TableCell>

                    <TableCell className="user-list__name-cell">
                      <Typography
                        variant="body2"
                        className="user-list__name"
                      >
                        {user.name || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell className="user-list__email">
                      {user.email || "-"}
                    </TableCell>

                    <TableCell>{user.age ?? "-"}</TableCell>

                    <TableCell>
                      {user.gender || "-"}
                    </TableCell>

                    <TableCell>
                      {user.department_name || "-"}
                    </TableCell>

                    <TableCell>
                      {user.city || "-"}
                    </TableCell>

                    <TableCell>
                      {safeAddress ? (
                        <div
                          className="user-list__address"
                          dangerouslySetInnerHTML={{
                            __html: safeAddress,
                          }}
                        />
                      ) : (
                        <span className="user-list__muted">-</span>
                      )}
                    </TableCell>

                    <TableCell className="user-list__date">
                      {formatDate(user.joined_date)}
                    </TableCell>

                    <TableCell>
                      {documentUrl ? (
                        <Link
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="none"
                          className="user-list__document-link"
                        >
                          <DescriptionOutlined fontSize="small" />
                          <span>View</span>
                        </Link>
                      ) : (
                        <Typography
                          variant="caption"
                          className="user-list__muted"
                        >
                          No document
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={user.is_active ? "Active" : "Inactive"}
                        className={
                          user.is_active
                            ? "user-list__status user-list__status--active"
                            : "user-list__status user-list__status--inactive"
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <div className="user-list__actions">
                        <Tooltip title="Edit user">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(user)}
                            aria-label={`Edit ${user.name}`}
                            className="user-list__edit-action"
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete user">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => onDelete(user.id)}
                              disabled={isDeleting}
                              aria-label={`Delete ${user.name}`}
                              className="user-list__delete-action"
                            >
                              {isDeleting ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DeleteOutlined fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default UserList;
