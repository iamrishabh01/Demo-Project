
import type { Pool, PoolConnection } from "mysql2/promise";
import db from "../config/database";
import departmentRepository from "../repositories/departmentRepository";
import type { DepartmentData } from "../repositories/departmentRepository";

type DatabaseConnection = Pool | PoolConnection;

const pool: Pool = db;

const getAllDepartments = async () => {
  return departmentRepository.findAllDepartments();
};

const getDepartmentById = async (departmentId: number) => {
  const department =
    await departmentRepository.findDepartmentById(departmentId);

  if (!department) {
    const error = new Error("Department not found.") as Error & {
      statusCode?: number;
    };

    error.statusCode = 404;
    throw error;
  }

  return department;
};

const createDepartment = async (data: DepartmentData) => {
  const existingDepartment =
    await departmentRepository.findDepartmentByName(data.name);

  if (existingDepartment) {
    const error = new Error("A department with this name already exists.") as Error & {
      statusCode?: number;
    };

    error.statusCode = 409;
    throw error;
  }

  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await departmentRepository.createDepartment(
      connection,
      data
    );

    await connection.commit();

    const department =
      await departmentRepository.findDepartmentById(result.insertId);

    return department;
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateDepartment = async (
  departmentId: number,
  data: DepartmentData
) => {
  await getDepartmentById(departmentId);

  const existingDepartment =
    await departmentRepository.findDepartmentByName(data.name);

  if (existingDepartment && existingDepartment.id !== departmentId) {
    const error = new Error("A department with this name already exists.") as Error & {
      statusCode?: number;
    };

    error.statusCode = 409;
    throw error;
  }

  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await departmentRepository.updateDepartment(
      connection,
      departmentId,
      data
    );

    await connection.commit();

    return await departmentRepository.findDepartmentById(departmentId);
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteDepartment = async (departmentId: number) => {
  await getDepartmentById(departmentId);

  const connection: PoolConnection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await departmentRepository.deleteDepartment(
      connection,
      departmentId
    );

    await connection.commit();

    return { message: "Department deleted successfully." };
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const departmentService = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

export {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

export default departmentService;
