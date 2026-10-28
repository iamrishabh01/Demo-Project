
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The backend must be started from its root directory.
 * This matches the upload directory configuration in upload.ts.
 */
const UPLOADS_DIRECTORY = path.resolve(
  process.cwd(),
  "uploads"
);

/**
 * Convert a public upload path into a physical file path.
 *
 * Example:
 * /uploads/profile-pictures/example.jpg
 *
 * becomes:
 * <backend-root>/uploads/profile-pictures/example.jpg
 *
 * Returns null for empty or unsafe paths.
 */
export const getPhysicalFilePath = (
  publicFilePath: string | null | undefined
): string | null => {
  if (!publicFilePath) {
    return null;
  }

  const normalizedPath = String(publicFilePath)
    .replace(/^[/\\]+/, "")
    .replace(/^uploads[/\\]+/i, "");

  if (!normalizedPath) {
    return null;
  }

  const physicalPath = path.resolve(
    UPLOADS_DIRECTORY,
    normalizedPath
  );

  // Prevent paths from escaping the uploads directory.
  const relativePath = path.relative(
    UPLOADS_DIRECTORY,
    physicalPath
  );

  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return physicalPath;
};

/**
 * Delete a stored physical file.
 *
 * Missing files are ignored, making cleanup idempotent.
 * Other filesystem errors are logged without crashing
 * the request.
 */
export const deletePhysicalFile = async (
  filePath: string | null | undefined
): Promise<void> => {
  if (!filePath) {
    return;
  }

  try {
    const physicalPath = getPhysicalFilePath(filePath);

    if (!physicalPath) {
      console.error(
        "FILE DELETE ERROR: Invalid upload path."
      );
      return;
    }

    await fs.unlink(physicalPath);

    console.log(
      `Deleted physical file: ${physicalPath}`
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    console.error("FILE DELETE ERROR:", error);
  }
};

const fileUtils = {
  getPhysicalFilePath,
  deletePhysicalFile,
};

export default fileUtils;
