
import type { ErrorRequestHandler } from "express";
import multer from "multer";

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

const errorHandler: ErrorRequestHandler = (
  error: AppError,
  req,
  res,
  _next
): void => {
  const timestamp = new Date().toISOString();

  console.error(
    `[${timestamp}] ${req.method} ${req.originalUrl}`,
    error
  );

  // 1. Multer upload errors
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        error: "Uploaded file exceeds the 15 MB limit.",
      });
      return;
    }

    res.status(400).json({
      error: error.message || "File upload failed.",
    });
    return;
  }

  // 2. Custom application errors
  if (typeof error.statusCode === "number") {
    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  // 3. MySQL duplicate entry (for example, duplicate email)
  if (error.code === "ER_DUP_ENTRY") {
    res.status(409).json({
      error: "A record with this value already exists.",
    });
    return;
  }

  // 4. MySQL foreign-key constraint errors
  if (
    error.code === "ER_NO_REFERENCED_ROW_2" ||
    error.code === "ER_ROW_IS_REFERENCED_2"
  ) {
    res.status(409).json({
      error:
        "This operation conflicts with an existing relationship. Check the related records.",
    });
    return;
  }

  // 5. Unexpected errors
  const statusCode =
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 600
      ? error.status
      : 500;

  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    error:
      isProduction && statusCode === 500
        ? "An unexpected server error occurred."
        : error.message || "Internal server error.",
  });
};

export default errorHandler;
