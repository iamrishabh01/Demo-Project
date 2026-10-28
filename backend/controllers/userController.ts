
import type { Request, Response, NextFunction } from "express";

import userService from "../services/userService";
import type { UploadedFiles } from "../services/fileService";

/**
 * Convert Multer's req.files into the field-based structure
 * expected by userService.
 */
const getUploadedFiles = (req: Request): UploadedFiles => {
  const files = req.files;

  if (!files || Array.isArray(files)) {
    return {};
  }

  return files as UploadedFiles;
};

/**
 * GET /users
 * Retrieve all users.
 */
const getUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json(users);
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /users/:id
 * Retrieve one user by ID.
 */
const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await userService.getUserById(userId);

    res.status(200).json(user);
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * POST /users
 * Create a user, optionally with a profile picture and document.
 */
const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedUser = req.validatedUser!;
    const uploadedFiles = getUploadedFiles(req);

    const result = await userService.createUser(
      validatedUser,
      uploadedFiles
    );

    res.status(201).json({
      message: "User created successfully.",
      ...result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * PUT /users/:id
 * Update a user, optionally replacing uploaded files.
 */
const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const validatedUser = req.validatedUser!;
    const uploadedFiles = getUploadedFiles(req);

    const user = await userService.updateUser(
      userId,
      validatedUser,
      uploadedFiles
    );

    res.status(200).json({
      message: "User updated successfully.",
      user,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * DELETE /users/:id
 * Delete one user.
 */
const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    const result = await userService.deleteUser(userId);

    res.status(200).json({
      ...result,
      message: "User deleted successfully.",
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * POST /users/bulk-delete
 * Delete multiple users.
 */
const deleteUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userIds = req.userIds!;

    const result = await userService.deleteUsers(userIds);

    res.status(200).json({
      message: `${result.deletedCount} user(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error: unknown) {
    next(error);
  }
};

const userController = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
};

export default userController;
