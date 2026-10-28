
import path from "node:path";
import type { Pool, PoolConnection } from "mysql2/promise";
import type { UserFileData } from "../repositories/userRepository";
import db from "../config/database";
import userRepository from "../repositories/userRepository";
import { deletePhysicalFile } from "../utils/fileUtils";

export type UploadedFileType = "profile_picture" | "document";

export interface UploadedFiles {
  profile_picture?: Express.Multer.File[];
  document?: Express.Multer.File[];
}

export interface SavedFile {
  id: number;
  user_id: number;
  file_type: UploadedFileType;
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

type DatabaseConnection = Pool | PoolConnection;

const saveUploadedFile = async (
  connection: PoolConnection,
  userId: number,
  fileType: UploadedFileType,
  file: Express.Multer.File | undefined
): Promise<number | null> => {
  if (!file) return null;

  const fileName = path.basename(file.filename);
  const folder =
    fileType === "profile_picture" ? "profile-pictures" : "documents";

  const publicPath = `/uploads/${folder}/${fileName}`;

  const fileData: UserFileData = {
    user_id: userId,
    file_type: fileType,
    original_name: file.originalname,
    stored_name: fileName,
    file_path: publicPath,
    mime_type: file.mimetype,
    file_size: file.size,
  };

  return userRepository.createUserFile(connection, fileData);
};

const saveUserFiles = async (
  connection: PoolConnection,
  userId: number,
  files?: UploadedFiles
): Promise<Array<number | null>> => {
  const savedFiles: Array<number | null> = [];

  const profilePicture = files?.profile_picture?.[0];
  const document = files?.document?.[0];

  if (profilePicture) {
    savedFiles.push(
      await saveUploadedFile(
        connection,
        userId,
        "profile_picture",
        profilePicture
      )
    );
  }

  if (document) {
    savedFiles.push(
      await saveUploadedFile(connection, userId, "document", document)
    );
  }

  return savedFiles;
};

const deleteFilesForUser = async (
  userId: number,
  connection: DatabaseConnection = db
): Promise<unknown[]> => {
  const files = await userRepository.findUserFiles(userId, connection);

  for (const file of files) {
    await deletePhysicalFile(file.file_path);
  }

  return files;
};

const deleteFilesForUsers = async (
  userIds: number[]
): Promise<unknown[]> => {
  if (userIds.length === 0) return [];

  const files = await userRepository.findFilesByUserIds(userIds);

  for (const file of files) {
    await deletePhysicalFile(file.file_path);
  }

  return files;
};

const fileService = {
  deletePhysicalFile,
  deleteFilesForUser,
  deleteFilesForUsers,
  saveUploadedFile,
  saveUserFiles,
};

export {
  deletePhysicalFile,
  deleteFilesForUser,
  deleteFilesForUsers,
  saveUploadedFile,
  saveUserFiles,
};

export default fileService;
