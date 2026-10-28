import { Route, Routes } from "react-router-dom";

import UsersPage from "../pages/UsersPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UsersPage />} />
      <Route path="/users" element={<UsersPage />} />
    </Routes>
  );
}
