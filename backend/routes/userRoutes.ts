
import express, { type Router } from "express";
import userController from "../controllers/userController";

import {
  validateUserBody,
  validateUserId,
  validateBulkUserIds,
} from "../middleware/validation";

import { userFileUpload } from "../middleware/upload";
import authenticate from "../middleware/authenticate";
import authorize from "../middleware/authorize";
import authorizeEmployee from "../middleware/authorizeEmployee";

const router: Router = express.Router();

// All user endpoints require authentication.
router.use(authenticate);

// Admin can view all employees.
router.get(
  "/",
  authorize("Admin"),
  userController.getUsers
);

// Admin can create employees.
router.post(
  "/",
  authorize("Admin"),
  userFileUpload,
  validateUserBody,
  userController.createUser
);

// Admin can bulk-delete employees.
// Keep this route before "/:id".
router.post(
  "/bulk-delete",
  authorize("Admin"),
  validateBulkUserIds,
  userController.deleteUsers
);

// Admin or the employee themselves can view a specific employee.
router.get(
  "/:id",
  validateUserId,
  authorizeEmployee,
  userController.getUserById
);

// Only Admin can update employees.
router.put(
  "/:id",
  authorize("Admin"),
  userFileUpload,
  validateUserId,
  validateUserBody,
  userController.updateUser
);

// Only Admin can delete employees.
router.delete(
  "/:id",
  authorize("Admin"),
  validateUserId,
  userController.deleteUser
);

export default router;
