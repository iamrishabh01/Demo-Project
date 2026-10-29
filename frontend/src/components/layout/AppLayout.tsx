
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app">
      {!isLoginPage && <Navbar />}
      <main className="app-main">{children}</main>
    </div>
  );
}
