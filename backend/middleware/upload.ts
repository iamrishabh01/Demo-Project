
import multer, {
  type FileFilterCallback,
  type StorageEngine,
} from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import type { Request } from "express";

const uploadRoot = path.resolve(process.cwd(), "uploads");

export const profilePictureDirectory = path.join(
  uploadRoot,
  "profile-pictures"
);

export const documentDirectory = path.join(
  uploadRoot,
  "documents"
);

// Create upload directories if they do not exist.
fs.mkdirSync(profilePictureDirectory, { recursive: true });
fs.mkdirSync(documentDirectory, { recursive: true });

type UploadError = Error & {
  statusCode?: number;
};

const createUploadError = (message: string): UploadError =>
  Object.assign(new Error(message), { statusCode: 400 });

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, callback) => {
    if (file.fieldname === "profile_picture") {
      callback(null, profilePictureDirectory);
      return;
    }

    if (file.fieldname === "document") {
      callback(null, documentDirectory);
      return;
    }

    callback(createUploadError(`Unsupported upload field: ${file.fieldname}`), "");
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const uniqueFilename = `${crypto.randomUUID()}${extension}`;

    callback(null, uniqueFilename);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (file.fieldname === "profile_picture") {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        createUploadError(
          "Profile picture must be JPG, PNG or WEBP."
        )
      );
      return;
    }

    callback(null, true);
    return;
  }

  if (file.fieldname === "document") {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        createUploadError(
          "Document must be PDF, DOC or DOCX."
        )
      );
      return;
    }

    callback(null, true);
    return;
  }

  callback(
    createUploadError(`Unsupported upload field: ${file.fieldname}`)
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 2,
  },
});

export const userFileUpload = upload.fields([
  {
    name: "profile_picture",
    maxCount: 1,
  },
  {
    name: "document",
    maxCount: 1,
  },
]);

export default {
  upload,
  userFileUpload,
  profilePictureDirectory,
  documentDirectory,
};
