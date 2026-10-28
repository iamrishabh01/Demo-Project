
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";

import userRoutes from "./routes/userRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import authRoutes from "./routes/authRoutes";
import errorHandler from "./middleware/errorHandler";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

// Public profile pictures only.
// Keep private employee documents out of public static serving.
app.use(
  "/uploads/profile-pictures",
  express.static(
    path.resolve(process.cwd(), "uploads", "profile-pictures")
  )
);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "User Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// Authentication: login, refresh, logout and current account.
app.use("/auth", authRoutes);

// Existing application routes.
// Authorization middleware will be added to these routers.
app.use("/users", userRoutes);
app.use("/departments", departmentRoutes);

// 404 handler must come after all routes.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found.",
    path: req.originalUrl,
  });
});

// Error handler must be the final middleware.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
