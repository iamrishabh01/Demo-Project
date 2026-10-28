
import type { Request, Response, NextFunction } from "express";
import departmentService from "../services/departmentService";

/**
 * GET /departments
 * Fetch all departments.
 */
export const getDepartments = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departments = await departmentService.getAllDepartments();

    res.status(200).json(departments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /departments/:id
 * Fetch one department.
 */
export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentId = req.departmentId!;

    const department =
      await departmentService.getDepartmentById(departmentId);

    res.status(200).json(department);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /departments
 * Create a department.
 */
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedDepartment = req.validatedDepartment!;

    const department =
      await departmentService.createDepartment(validatedDepartment);

    res.status(201).json({
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /departments/:id
 * Update a department.
 */
export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentId = req.departmentId!;
    const validatedDepartment = req.validatedDepartment!;

    const department = await departmentService.updateDepartment(
      departmentId,
      validatedDepartment
    );

    res.status(200).json({
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /departments/:id
 * Delete a department.
 */
export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departmentId = req.departmentId!;

    await departmentService.deleteDepartment(departmentId);

    res.status(200).json({
      message: "Department deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const departmentController = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

export default departmentController;
