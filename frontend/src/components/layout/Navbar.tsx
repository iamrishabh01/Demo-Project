
import { useState } from "react";
import { Home, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHomeActive = location.pathname === "/";

  function closeMobileMenu(): void {
    setMobileOpen(false);
  }

  function toggleMobileMenu(): void {
    setMobileOpen((current) => !current);
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
          className={`nav-links ${mobileOpen ? "mobile-open" : ""}`}
        >
          <Link
            to="/"
            className={`nav-link ${isHomeActive ? "active" : ""}`}
            onClick={closeMobileMenu}
            aria-current={isHomeActive ? "page" : undefined}
          >
            <Home size={16} strokeWidth={2} aria-hidden="true" />
            <span>Home</span>
          </Link>
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
