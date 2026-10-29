
import { useState } from "react";

import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

import type { User } from "../../types";
import "./UserTable.scss";

export type SortField = "name" | "age" | "is_active" | "joined_date";
export type SortDirection = "asc" | "desc";

export interface UserTableProps {
  users: User[];
  selectedUsers: number[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelect: (userId: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAddUser: () => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  loading: boolean;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function resolveUploadUrl(
  value: string | null | undefined,
  folder: "profile-pictures" | "documents",
): string | undefined {
  if (!value) return undefined;

  const normalizedValue = value.trim().replace(/\\/g, "/");

  if (
    /^https?:\/\//i.test(normalizedValue) ||
    normalizedValue.startsWith("data:")
  ) {
    return normalizedValue;
  }

  const withoutLeadingSlash = normalizedValue.replace(/^\/+/, "");
  const withoutUploadsPrefix = withoutLeadingSlash.replace(
    /^uploads\//i,
    "",
  );
  const relativePath = withoutUploadsPrefix.startsWith(`${folder}/`)
    ? withoutUploadsPrefix
    : `${folder}/${withoutUploadsPrefix}`;

  return `${API_BASE_URL}/uploads/${relativePath.replace(/^\/+/, "")}`;
}

function getProfilePicture(user: User): string | undefined {
  return resolveUploadUrl(user.profile_picture, "profile-pictures");
}

function SortLabel({
  field,
  label,
  activeField,
  direction,
  onSort,
}: {
  field: SortField;
  label: string;
  activeField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const active = field === activeField;

  return (
    <button
      type="button"
      className={`user-table__sort-button ${active ? "is-active" : ""}`}
      onClick={() => onSort(field)}
    >
      {label}

      {active ? (
        direction === "asc" ? (
          <ArrowUpwardIcon fontSize="inherit" />
        ) : (
          <ArrowDownwardIcon fontSize="inherit" />
        )
      ) : (
        <UnfoldMoreIcon fontSize="inherit" />
      )}
    </button>
  );
}

export default function UserTable({
  users,
  selectedUsers,
  allSelected,
  someSelected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onAddUser,
  sortField,
  sortDirection,
  onSort,
  loading,
}: UserTableProps) {
  const [failedImages, setFailedImages] = useState<number[]>([]);

  if (loading && users.length === 0) {
    return (
      <Paper className="user-table__paper" elevation={0}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton
            key={index}
            height={62}
            animation="wave"
            sx={{ mx: 2 }}
          />
        ))}
      </Paper>
    );
  }

  if (users.length === 0) {
    return (
      <Paper className="user-table__empty" elevation={0}>
        <Box className="user-table__empty-icon">
          <PersonAddAlt1Icon />
        </Box>

        <Typography variant="h6">No users found</Typography>

        <Typography variant="body2">
          Add a user or change your search to see results.
        </Typography>

        <button
          type="button"
          className="user-table__empty-action"
          onClick={onAddUser}
        >
          <PersonAddAlt1Icon fontSize="small" />
          Add a User
        </button>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      className="user-table__paper"
    >
      <Table stickyHeader aria-label="User management table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" className="user-table__checkbox-cell">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleSelectAll}
                slotProps={{
                  input: {
                    "aria-label": "Select all visible users",
                  },
                }}
              />
            </TableCell>

            <TableCell>
              <SortLabel
                field="name"
                label="User"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </TableCell>

            <TableCell>Email</TableCell>
            <TableCell>Department</TableCell>

            <TableCell>
              <SortLabel
                field="age"
                label="Age"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </TableCell>

            <TableCell>City</TableCell>
            <TableCell>Gender</TableCell>

            <TableCell>
              <SortLabel
                field="joined_date"
                label="Joined Date"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </TableCell>

            <TableCell>
              <SortLabel
                field="is_active"
                label="Status"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSort}
              />
            </TableCell>

            <TableCell>Documents</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {users.map((user) => {
            const selected = selectedUsers.includes(user.id);
            const pictureUrl = getProfilePicture(user);
            const hasPicture =
              Boolean(pictureUrl) && !failedImages.includes(user.id);

            return (
              <TableRow
                key={user.id}
                hover
                selected={selected}
                className="user-table__row"
              >
                <TableCell
                  padding="checkbox"
                  className="user-table__checkbox-cell"
                >
                  <Checkbox
                    checked={selected}
                    onChange={() => onToggleSelect(user.id)}
                    slotProps={{
                      input: {
                        "aria-label": `Select ${user.name}`,
                      },
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Box className="user-table__identity">
                    <Avatar
                      src={hasPicture ? pictureUrl : undefined}
                      alt={`${user.name} profile`}
                      slotProps={{
                        img: {
                          onError: () => {
                            setFailedImages((current) =>
                              current.includes(user.id)
                                ? current
                                : [...current, user.id],
                            );
                          },
                        },
                      }}
                      className="user-table__avatar"
                    >
                      <PersonOutlinedIcon />
                    </Avatar>

                    <Box className="user-table__user-info">
                      <Typography className="user-table__name">
                        {user.name}
                      </Typography>
                      <Typography className="user-table__secondary">
                        ID: {user.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <span className="user-table__email">
                    {user.email || "—"}
                  </span>
                </TableCell>

                <TableCell>
                  {user.department_name || "—"}
                </TableCell>

                <TableCell>{user.age ?? "—"}</TableCell>
                <TableCell>{user.city || "—"}</TableCell>
                <TableCell>{user.gender || "—"}</TableCell>

                <TableCell>
                  {formatDate(user.joined_date)}
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={user.is_active ? "Active" : "Inactive"}
                    className={`user-table__status ${
                      user.is_active
                        ? "user-table__status--active"
                        : "user-table__status--inactive"
                    }`}
                  />
                </TableCell>

                <TableCell>
                  {user.document ? (
                    <Tooltip title="Open document">
                      <IconButton
                        component="a"
                        href={resolveUploadUrl(user.document, "documents")}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        aria-label={`Open document for ${user.name}`}
                        className="user-table__document-button"
                      >
                        <DescriptionOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <span className="user-table__no-document">—</span>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Box className="user-table__actions">
                    <Tooltip title="Edit user">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(user)}
                        aria-label={`Edit ${user.name}`}
                        className="user-table__edit-action"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete user">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(user)}
                        aria-label={`Delete ${user.name}`}
                        className="user-table__delete-action"
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
