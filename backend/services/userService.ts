
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import fs from "node:fs/promises";

import db from "../config/database";
import userRepository from "../repositories/userRepository";
import fileService from "./fileService";

export type Gender = "Male" | "Female" | "Other";

export interface UserData {
  name: string;
  email: string;
  age: number | null;
  city: string | null;
  joined_date: string | null;
  is_active: 0 | 1;
  gender: Gender | null;
  department_id: number | null;
  address: string | null;
}

export interface UserFile {
  id: number;
  user_id: number;
  file_type: "profile_picture" | "document";
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at?: string | Date;
}

export interface User extends UserData {
  id: number;
  department_name: string | null;
  files: UserFile[];
}

export interface UploadedFiles {
  profile_picture?: Express.Multer.File[];
  document?: Express.Multer.File[];
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  age: number | null;
  city: string | null;
  joined_date: string | null;
  is_active: number;
  gender: Gender | null;
  department_id: number | null;
  department_name: string | null;
  address: string | null;
  file_id: number | null;
  file_type: UserFile["file_type"] | null;
  original_name: string | null;
  stored_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_created_at: string | Date | null;
}

interface ServiceError extends Error {
  statusCode?: number;
}

interface UserRepositoryContract {
  findAllUsers(): Promise<UserRow[]>;
  findUserById(id: number): Promise<Omit<User, "files"> | null>;
  findUserFiles(
    id: number,
    connection?: PoolConnection
  ): Promise<UserFile[]>;
  findFilesByUserIds(ids: number[]): Promise<UserFile[]>;
  createUser(connection: PoolConnection, data: UserData): Promise<number>;
  updateUser(
    connection: PoolConnection,
    id: number,
    data: UserData
  ): Promise<unknown>;
  deleteUser(connection: PoolConnection, id: number): Promise<unknown>;
  deleteUsers(
    connection: PoolConnection,
    ids: number[]
  ): Promise<{ affectedRows: number }>;
}

interface FileServiceContract {
  saveUserFiles(
    connection: PoolConnection,
    userId: number,
    files: UploadedFiles
  ): Promise<number[]>;
  deletePhysicalFile(filePath: string | null | undefined): Promise<void>;
}

const repository =
  userRepository as UserRepositoryContract;

const filesService =
  fileService as FileServiceContract;

const createServiceError = (
  message: string,
  statusCode: number
): ServiceError => {
  const error: ServiceError = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Removes a newly uploaded physical file using its absolute disk path.
 * This is separate from deletePhysicalFile, which accepts stored public paths.
 */
const removeNewUploads = async (
  paths: string[]
): Promise<void> => {
  for (const filePath of paths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code !== "ENOENT") {
        console.error("UPLOADED FILE CLEANUP ERROR:", error);
      }
    }
  }
};

/**
 * GET ALL USERS
 */
const getAllUsers = async (): Promise<User[]> => {
  const rows = await repository.findAllUsers();
  const usersMap = new Map<number, User>();

  for (const row of rows) {
    if (!usersMap.has(row.id)) {
      usersMap.set(row.id, {
        id: row.id,
        name: row.name,
        email: row.email,
        age: row.age,
        city: row.city,
        joined_date: row.joined_date,
        is_active: row.is_active as 0 | 1,
        gender: row.gender,
        department_id: row.department_id,
        department_name: row.department_name,
        address: row.address,
        files: [],
      });
    }

    if (
      row.file_id &&
      row.file_type &&
      row.file_path &&
      row.original_name &&
      row.stored_name &&
      row.mime_type &&
      row.file_size !== null
    ) {
      usersMap.get(row.id)!.files.push({
        id: row.file_id,
        user_id: row.id,
        file_type: row.file_type,
        original_name: row.original_name,
        stored_name: row.stored_name,
        file_path: row.file_path,
        mime_type: row.mime_type,
        file_size: row.file_size,
        created_at: row.file_created_at ?? undefined,
      });
    }
  }

  return Array.from(usersMap.values());
};

/**
 * GET SINGLE USER
 */
const getUserById = async (userId: number): Promise<User> => {
  const user = await repository.findUserById(userId);

  if (!user) {
    throw createServiceError("User not found.", 404);
  }

  const files = await repository.findUserFiles(userId);

  return {
    ...user,
    files,
  };
};

/**
 * CREATE USER
 */
const createUser = async (
  userData: UserData,
  uploadedFiles: UploadedFiles = {}
): Promise<{ user: User; fileIds: number[] }> => {
  const connection = await db.getConnection();

  // Track uploaded disk paths before database work begins.
  const uploadedFilePaths = [
    uploadedFiles.profile_picture?.[0]?.path,
    uploadedFiles.document?.[0]?.path,
  ].filter((filePath): filePath is string => Boolean(filePath));

  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const userId = await repository.createUser(connection, userData);

    const fileIds = await filesService.saveUserFiles(
      connection,
      userId,
      uploadedFiles
    );

    await connection.commit();
    transactionStarted = false;

    const user = await getUserById(userId);

    return {
      user,
      fileIds,
    };
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    await removeNewUploads(uploadedFilePaths);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * UPDATE USER
 *
 * Existing files are retained unless a replacement is uploaded.
 */
const updateUser = async (
  userId: number,
  userData: UserData,
  uploadedFiles: UploadedFiles = {}
): Promise<User> => {
  const existingUser = await repository.findUserById(userId);

  if (!existingUser) {
    throw createServiceError("User not found.", 404);
  }

  const connection = await db.getConnection();

  const newUploadedPaths = [
    uploadedFiles.profile_picture?.[0]?.path,
    uploadedFiles.document?.[0]?.path,
  ].filter((filePath): filePath is string => Boolean(filePath));

  let transactionStarted = false;
  let filesToDelete: UserFile[] = [];

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    await repository.updateUser(connection, userId, userData);

    const oldFiles = await repository.findUserFiles(
      userId,
      connection
    );

    if (uploadedFiles.profile_picture?.[0]) {
      filesToDelete.push(
        ...oldFiles.filter(
          (file) => file.file_type === "profile_picture"
        )
      );
    }

    if (uploadedFiles.document?.[0]) {
      filesToDelete.push(
        ...oldFiles.filter(
          (file) => file.file_type === "document"
        )
      );
    }

    for (const oldFile of filesToDelete) {
      await connection.execute(
        "DELETE FROM user_files WHERE id = ?",
        [oldFile.id]
      );
    }

    await filesService.saveUserFiles(
      connection,
      userId,
      uploadedFiles
    );

    await connection.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    await removeNewUploads(newUploadedPaths);
    throw error;
  } finally {
    connection.release();
  }

  // Delete replaced physical files only after the DB commit succeeds.
  for (const oldFile of filesToDelete) {
    await filesService.deletePhysicalFile(oldFile.file_path);
  }

  return getUserById(userId);
};

/**
 * DELETE ONE USER
 */
const deleteUser = async (
  userId: number
): Promise<{ message: string }> => {
  const existingUser = await repository.findUserById(userId);

  if (!existingUser) {
    throw createServiceError("User not found.", 404);
  }

  const userFiles = await repository.findUserFiles(userId);
  const connection = await db.getConnection();

  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    await repository.deleteUser(connection, userId);

    await connection.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }

  for (const file of userFiles) {
    await filesService.deletePhysicalFile(file.file_path);
  }

  return {
    message: "User deleted successfully.",
  };
};

/**
 * BULK DELETE USERS
 */
const deleteUsers = async (
  userIds: number[]
): Promise<{ message: string; deletedCount: number }> => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createServiceError(
      "At least one user ID is required.",
      400
    );
  }

  const userFiles = await repository.findFilesByUserIds(userIds);
  const connection = await db.getConnection();

  let transactionStarted = false;
  let deletedCount = 0;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const result = await repository.deleteUsers(
      connection,
      userIds
    );

    deletedCount = result.affectedRows;

    await connection.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection.release();
  }

  for (const file of userFiles) {
    await filesService.deletePhysicalFile(file.file_path);
  }

  return {
    message: "Users deleted successfully.",
    deletedCount,
  };
};

const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
};

export default userService;
