
import type { FormikErrors } from "formik";

export interface UserValidationValues {
  name?: string | null;
  email?: string | null;
  age?: string | number | null;
  city?: string | null;
  joined_date?: string | null;
  gender?: string | null;
  department_id?: string | number | null;
  is_active?: boolean | number | string;
  address?: string | null;
  profile_picture?: File | null;
  document?: File | null;
}

const NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CITY_REGEX = /^[A-Za-z\s.'-]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const PROFILE_PICTURE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PROFILE_PICTURE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
]);

function getExtension(fileName: string): string {
  const cleanName = fileName.split(/[?#]/)[0] ?? "";
  const lastDot = cleanName.lastIndexOf(".");

  return lastDot >= 0
    ? cleanName.slice(lastDot + 1).toLowerCase()
    : "";
}

export function validateName(value: unknown): string {
  const name = String(value ?? "").trim();

  if (!name) return "Name is required.";

  if (!NAME_REGEX.test(name)) {
    return "Name can only contain letters, spaces, dots, apostrophes and hyphens.";
  }

  return "";
}

export function validateEmail(value: unknown): string {
  const email = String(value ?? "").trim();

  if (!email) return "Email is required.";

  if (!EMAIL_REGEX.test(email)) {
    return "Invalid email format.";
  }

  return "";
}

export function validateAge(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const age = Number(value);

  if (!Number.isInteger(age)) {
    return "Age must be a valid number.";
  }

  if (age < 1 || age > 120) {
    return "Age must be between 1 and 120.";
  }

  return "";
}

export function validateCity(value: unknown): string {
  const city = String(value ?? "").trim();

  if (!city) return "";

  if (!CITY_REGEX.test(city)) {
    return "City can only contain letters, spaces, dots, apostrophes and hyphens.";
  }

  return "";
}

export function validateJoinedDate(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const date = String(value).trim();

  if (!DATE_REGEX.test(date)) {
    return "Joined date must be in YYYY-MM-DD format.";
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  const isValid =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;

  return isValid ? "" : "Please enter a valid joined date.";
}

export function validateDepartmentId(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const departmentId = Number(value);

  if (!Number.isInteger(departmentId) || departmentId < 1) {
    return "Department ID must be a valid positive number.";
  }

  return "";
}

export function validateGender(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (!["Male", "Female", "Other"].includes(String(value))) {
    return "Please select a valid gender.";
  }

  return "";
}

export function validateAddress(value: unknown): string {
  const address = String(value ?? "");

  // Strip tags for a basic user-facing length check.
  const plainText = address.replace(/<[^>]*>/g, "").trim();

  if (plainText.length > 5000) {
    return "Address cannot exceed 5000 characters.";
  }

  return "";
}

export function validateProfilePicture(file: File | null | undefined): string {
  if (!file) return "";

  if (file.size > MAX_FILE_SIZE) {
    return "Profile picture must not exceed 15 MB.";
  }

  const extension = getExtension(file.name);

  if (
    !PROFILE_PICTURE_EXTENSIONS.has(extension) ||
    !PROFILE_PICTURE_TYPES.has(file.type)
  ) {
    return "Upload a JPG, JPEG, PNG or WEBP image.";
  }

  return "";
}

export function validateDocument(file: File | null | undefined): string {
  if (!file) return "";

  if (file.size > MAX_FILE_SIZE) {
    return "Document must not exceed 15 MB.";
  }

  const extension = getExtension(file.name);

  if (
    !DOCUMENT_EXTENSIONS.has(extension) ||
    !DOCUMENT_TYPES.has(file.type)
  ) {
    return "Upload a PDF, DOC or DOCX document.";
  }

  return "";
}

export function validateUser(
  values: UserValidationValues,
): FormikErrors<UserValidationValues> {
  const errors: FormikErrors<UserValidationValues> = {};

  const nameError = validateName(values.name);
  const emailError = validateEmail(values.email);
  const ageError = validateAge(values.age);
  const cityError = validateCity(values.city);
  const dateError = validateJoinedDate(values.joined_date);
  const genderError = validateGender(values.gender);
  const departmentError = validateDepartmentId(values.department_id);
  const addressError = validateAddress(values.address);
  const pictureError = validateProfilePicture(values.profile_picture);
  const documentError = validateDocument(values.document);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (ageError) errors.age = ageError;
  if (cityError) errors.city = cityError;
  if (dateError) errors.joined_date = dateError;
  if (genderError) errors.gender = genderError;
  if (departmentError) errors.department_id = departmentError;
  if (addressError) errors.address = addressError;
  if (pictureError) errors.profile_picture = pictureError;
  if (documentError) errors.document = documentError;

  return errors;
}
