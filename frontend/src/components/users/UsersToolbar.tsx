
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";

import "./UsersToolbar.scss";

interface UsersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddUser: () => void;
  onRefresh: () => void;
  loading: boolean;
  saving: boolean;
}

export default function UsersToolbar({
  search,
  onSearchChange,
  onAddUser,
  onRefresh,
  loading,
  saving,
}: UsersToolbarProps) {
  return (
    <section className="users-toolbar">
      <header className="users-toolbar__header">
        <div className="users-toolbar__heading">
          <span className="users-toolbar__eyebrow">
            USER MANAGEMENT
          </span>

          <h1>All Users</h1>

          <p>
            Manage users, departments, account status and documents.
          </p>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddUser}
          disabled={saving}
          className="users-toolbar__add-button"
        >
          Add a User
        </Button>
      </header>

      <div className="users-toolbar__controls">
        <TextField
          fullWidth
          size="small"
          placeholder="Search users..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search users"
          className="users-toolbar__search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="Clear search"
                    onClick={() => onSearchChange("")}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <Button
          variant="outlined"
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={onRefresh}
          disabled={loading || saving}
          className="users-toolbar__refresh-button"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </section>
  );
}
