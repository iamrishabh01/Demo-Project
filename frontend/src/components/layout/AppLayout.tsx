import type { ReactNode } from "react";

import Navbar from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">{children}</main>
    </div>
  );
}
