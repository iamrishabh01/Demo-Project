
import { BrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import AppRoutes from "./routes/AppRoutes";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </BrowserRouter>
  );
}
