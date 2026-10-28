
import express, { type Router } from "express";

import departmentController from "../controllers/departmentController";
import {
  validateDepartmentId,
  validateDepartmentBody,
} from "../middleware/validation";
import authenticate from "../middleware/authenticate";
import authorize from "../middleware/authorize";

const router: Router = express.Router();

// Every department endpoint requires authentication.
router.use(authenticate);

// GET /departments
// Admin, Employee and Guest can read department information.
router.get(
  "/",
  authorize("Admin", "Employee", "Guest"),
  departmentController.getDepartments
);

// POST /departments
// Admin only.
router.post(
  "/",
  authorize("Admin"),
  validateDepartmentBody,
  departmentController.createDepartment
);

// GET /departments/:id
// Admin, Employee and Guest can read a department.
router.get(
  "/:id",
  authorize("Admin", "Employee", "Guest"),
  validateDepartmentId,
  departmentController.getDepartmentById
);

// PUT /departments/:id
// Admin only.
router.put(
  "/:id",
  authorize("Admin"),
  validateDepartmentId,
  validateDepartmentBody,
  departmentController.updateDepartment
);

// DELETE /departments/:id
// Admin only.
router.delete(
  "/:id",
  authorize("Admin"),
  validateDepartmentId,
  departmentController.deleteDepartment
);

export default router;
