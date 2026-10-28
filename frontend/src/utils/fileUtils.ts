
import { API_BASE_URL } from "../config/env";
import type { UserFile } from "../types";

export type FileReference =
  | string
  | Pick<UserFile, "file_path" | "file_type" | "original_name" | "stored_name">
  | null
  | undefined;

export interface BrowserFileLike {
  name?: string;
  type?: string;
  original_name?: string;
  file_path?: string;
  file_type?: string;
}

export function getFileUrl(
  filePath: string | null | undefined,
): string | null {
  if (!filePath) return null;

  const path = filePath.trim();

  if (!path) return null;

  // Keep absolute URLs and browser-created preview URLs intact.
  if (/^(https?:\/\/|blob:)/i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

export function formatFileSize(
  bytes: number | string | null | undefined,
): string {
  if (bytes === null || bytes === undefined || bytes === "") {
    return "—";
  }

  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "—";
  }

  if (size === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );

  const value = size / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export function getFileExtension(
  fileName: string | null | undefined,
): string {
  if (!fileName) return "";

  const cleanName = fileName.split(/[?#]/)[0] ?? "";
  const lastDot = cleanName.lastIndexOf(".");

  if (lastDot <= 0) return "";

  return cleanName.slice(lastDot + 1).toLowerCase();
}

export function getFileTypeLabel(
  file: BrowserFileLike | null | undefined,
): string {
  if (!file) return "File";

  if (file.file_type === "profile_picture") {
    return "Profile Picture";
  }

  if (file.file_type === "document") {
    return "Document";
  }

  return "File";
}

export function isImageFile(
  file: BrowserFileLike | File | null | undefined,
): boolean {
  if (!file) return false;

  if (file.type?.startsWith("image/")) {
    return true;
  }

  const extension = getFileExtension(getFileName(file));

  return ["jpg", "jpeg", "png", "webp", "gif"].includes(extension);
}

export function isDocumentFile(
  file: BrowserFileLike | File | null | undefined,
): boolean {
  if (!file) return false;

  const extension = getFileExtension(getFileName(file));

  return ["pdf", "doc", "docx"].includes(extension);
}

function getFileName(file: BrowserFileLike | File): string | undefined {
  const name = "name" in file ? file.name : undefined;
  const originalName =
    "original_name" in file ? file.original_name : undefined;
  const filePath = "file_path" in file ? file.file_path : undefined;

  return name || originalName || filePath;
}

const fileUtils = {
  getFileUrl,
  formatFileSize,
  getFileExtension,
  getFileTypeLabel,
  isImageFile,
  isDocumentFile,
};

export default fileUtils;
