
import type { Request, Response, NextFunction } from "express";

import { sanitizeInput, sanitizeAddress } from "../utils/sanitizer";
import type {
  ValidatedUser,
  ValidatedDepartment,
} from "../types/express";

/* -------------------------------------------------------------------------- */
/* Common validation helpers                                                   */
/* -------------------------------------------------------------------------- */

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const isValidName = (value: unknown): boolean =>
  typeof value === "string" &&
  value.trim().length >= 2 &&
  value.trim().length <= 100 &&
  /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(value.trim());

const isValidEmail = (value: unknown): boolean =>
  typeof value === "string" &&
  value.trim().length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidAge = (value: unknown): boolean => {
  if (isEmpty(value)) return true;

  const age = Number(value);
  return Number.isInteger(age) && age >= 1 && age <= 120;
};

const isValidCity = (value: unknown): boolean =>
  isEmpty(value) ||
  (typeof value === "string" &&
    value.trim().length <= 100 &&
    /^[\p{L}\p{M}\s.'-]+$/u.test(value.trim()));

const isValidJoinedDate = (value: unknown): boolean => {
  if (isEmpty(value)) return true;
  if (typeof value !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidGender = (
  value: unknown
): value is "Male" | "Female" | "Other" | "" =>
  value === "" ||
  value === "Male" ||
  value === "Female" ||
  value === "Other";

const isValidActiveStatus = (value: unknown): boolean =>
  [0, 1, "0", "1", true, false, "true", "false"].some(
    (candidate) => candidate === value
  );

const isValidAddress = (value: unknown): boolean =>
  isEmpty(value) ||
  (typeof value === "string" && value.length <= 10000);

/* -------------------------------------------------------------------------- */
/* Reusable validation functions                                               */
/* -------------------------------------------------------------------------- */

export const validateName = (value: unknown): string | null =>
  isValidName(value) ? null : "Invalid name.";

export const validateEmail = (value: unknown): string | null =>
  isValidEmail(value) ? null : "Invalid email address.";

export const validateAge = (value: unknown): string | null =>
  isValidAge(value) ? null : "Age must be a whole number between 1 and 120.";

export const validateCity = (value: unknown): string | null =>
  isValidCity(value) ? null : "Invalid city.";

export const validateJoinedDate = (value: unknown): string | null =>
  isValidJoinedDate(value)
    ? null
    : "Invalid date format (use YYYY-MM-DD).";

export const validateDepartmentIdValue = (
  value: unknown
): string | null => {
  if (isEmpty(value)) return null;

  const departmentId = Number(value);

  return Number.isInteger(departmentId) && departmentId > 0
    ? null
    : "Invalid department ID.";
};

export const validateGender = (value: unknown): string | null =>
  isValidGender(value) ? null : "Gender must be Male, Female, or Other.";

export const validateIsActive = (value: unknown): string | null =>
  isValidActiveStatus(value) ? null : "is_active must be 0 or 1.";

export const validateAddress = (value: unknown): string | null =>
  isValidAddress(value) ? null : "Invalid address.";

export const validateDepartmentBodyValue = (
  value: unknown
): string | null =>
  isEmpty(value) ||
  (typeof value === "string" && value.trim().length <= 1000)
    ? null
    : "Department description must not exceed 1000 characters.";

/* -------------------------------------------------------------------------- */
/* Normalization helpers                                                       */
/* -------------------------------------------------------------------------- */

const normalizeNullableString = (
  value: unknown
): string | null => {
  if (isEmpty(value)) return null;
  return String(sanitizeInput(String(value)));
};

const normalizeNullableNumber = (
  value: unknown
): number | null => {
  if (isEmpty(value)) return null;
  return Number(value);
};

const normalizeActiveStatus = (value: unknown): 0 | 1 => {
  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return 0;
  }

  return 1;
};

/* -------------------------------------------------------------------------- */
/* Validate user request body                                                  */
/* -------------------------------------------------------------------------- */

export const validateUserBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body = req.body as Record<string, unknown>;

  const {
    name,
    email,
    age,
    city,
    gender,
    department_id,
    is_active,
    address,
  } = body;

  // The database column is joined_date. Accept the old field name as well.
  const joinedDateValue = body.joined_date ?? body.date_of_joining;

  if (!isValidName(name)) {
    res.status(400).json({
      error: "Name is required and must be between 2 and 100 valid characters.",
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      error: "A valid email address is required.",
    });
    return;
  }

  if (!isValidAge(age)) {
    res.status(400).json({
      error: "Age must be a whole number between 1 and 120.",
    });
    return;
  }

  if (!isValidCity(city)) {
    res.status(400).json({
      error: "City contains invalid characters or exceeds 100 characters.",
    });
    return;
  }

  if (!isValidJoinedDate(joinedDateValue)) {
    res.status(400).json({
      error: "Invalid date format (use YYYY-MM-DD).",
    });
    return;
  }

  const departmentError = validateDepartmentIdValue(department_id);

  if (departmentError) {
    res.status(400).json({ error: departmentError });
    return;
  }

  if (!isValidGender(gender)) {
    res.status(400).json({
      error: "Gender must be Male, Female, or Other.",
    });
    return;
  }

  if (!isValidActiveStatus(is_active)) {
    res.status(400).json({
      error: "is_active must be 0 or 1.",
    });
    return;
  }

  if (!isValidAddress(address)) {
    res.status(400).json({
      error: "Address is invalid or exceeds the maximum length.",
    });
    return;
  }

  const sanitizedName = String(sanitizeInput(String(name))).trim();
  const sanitizedEmail = String(
    sanitizeInput(String(email))
  ).trim().toLowerCase();

  const sanitizedAddress = isEmpty(address)
    ? null
    : sanitizeAddress(String(address));

  const normalizedGender = isEmpty(gender)
    ? null
    : (gender as "Male" | "Female" | "Other");

  const validatedUser: ValidatedUser = {
    name: sanitizedName,
    email: sanitizedEmail,
    age: normalizeNullableNumber(age),
    city: normalizeNullableString(city),
    joined_date: isEmpty(joinedDateValue)
      ? null
      : String(joinedDateValue).trim(),
    gender: normalizedGender,
    department_id: normalizeNullableNumber(department_id),
    is_active: normalizeActiveStatus(is_active),
    address: sanitizedAddress,
  };

  req.validatedUser = validatedUser;
  next();
};

/* -------------------------------------------------------------------------- */
/* Validate user ID                                                            */
/* -------------------------------------------------------------------------- */

export const validateUserId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "Invalid user ID." });
    return;
  }

  req.userId = userId;
  next();
};

/* -------------------------------------------------------------------------- */
/* Validate bulk-delete IDs                                                    */
/* -------------------------------------------------------------------------- */

export const validateBulkUserIds = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ids: unknown = req.body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({
      error: "Provide a non-empty array of user IDs.",
    });
    return;
  }

  const normalizedIds = ids.map(Number);

  if (
    normalizedIds.some(
      (id) => !Number.isInteger(id) || id <= 0
    )
  ) {
    res.status(400).json({
      error: "Every user ID must be a positive integer.",
    });
    return;
  }

  req.userIds = [...new Set(normalizedIds)];
  next();
};

/* -------------------------------------------------------------------------- */
/* Validate department ID                                                      */
/* -------------------------------------------------------------------------- */

export const validateDepartmentIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const departmentId = Number(req.params.id);

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    res.status(400).json({ error: "Invalid department ID." });
    return;
  }

  req.departmentId = departmentId;
  next();
};

// Alias used by departmentRoutes.ts.
export const validateDepartmentId = validateDepartmentIdMiddleware;

/* -------------------------------------------------------------------------- */
/* Validate department request body                                            */
/* -------------------------------------------------------------------------- */

export const validateDepartmentBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body = req.body as Record<string, unknown>;

  const { name, description, is_active } = body;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  ) {
    res.status(400).json({
      error: "Department name must be between 2 and 100 characters.",
    });
    return;
  }

  if (!isValidActiveStatus(is_active)) {
    res.status(400).json({
      error: "is_active must be 0 or 1.",
    });
    return;
  }

  if (
    !isEmpty(description) &&
    (typeof description !== "string" || description.length > 1000)
  ) {
    res.status(400).json({
      error: "Department description must not exceed 1000 characters.",
    });
    return;
  }

  const validatedDepartment: ValidatedDepartment = {
    name: String(sanitizeInput(name)).trim(),
    description: normalizeNullableString(description),
    is_active: normalizeActiveStatus(is_active),
  };

  req.validatedDepartment = validatedDepartment;
  next();
};
