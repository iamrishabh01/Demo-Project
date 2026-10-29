
import { useState } from "react";
import { Home, LogOut, Menu, X } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { logout } from "../../services/apiClient";
import "./Navbar.scss";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isHomeActive = location.pathname === "/";

  function closeMobileMenu(): void {
    setMobileOpen(false);
  }

  function toggleMobileMenu(): void {
    setMobileOpen((current) => !current);
  }

  async function handleLogout(): Promise<void> {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      closeMobileMenu();
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-container">
        <div className="nav-brand">
          <Link to="/" onClick={closeMobileMenu}>
            <h2>User Management System</h2>
          </Link>
        </div>

        <div
          id="main-navigation-links"
          className={`nav-links ${mobileOpen ? "mobile-open" : ""}`}
        >
          

          <button
            type="button"
            className="nav-link"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>

        <button
          type="button"
          className="nav-menu-button"
          onClick={toggleMobileMenu}
          aria-label={
            mobileOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={mobileOpen}
          aria-controls="main-navigation-links"
        >
          {mobileOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Menu size={20} aria-hidden="true" />
          )}
        </button>
      </div>
    </nav>
  );
}
