
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import db from "../config/database";

/**
 * Database connection types
 */
type DatabaseConnection = Pool | PoolConnection;

/**
 * Department row returned by MySQL
 */
export interface DepartmentRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  is_active: 0 | 1;
}

/**
 * Department data used for create/update operations
 */
export interface DepartmentData {
  name: string;
  description: string | null;
  is_active: 0 | 1;
}

/**
 * Database pool
 */
const pool: Pool = db;

/**
 * Get all departments
 */
const findAllDepartments = async (): Promise<DepartmentRow[]> => {
  const [rows] = await pool.query<DepartmentRow[]>(
    `SELECT
       id,
       name,
       description,
       is_active
     FROM departments
     ORDER BY name ASC`
  );

  return rows;
};

/**
 * Get a department by ID
 */
const findDepartmentById = async (
  id: number,
  connection: DatabaseConnection = pool
): Promise<DepartmentRow | null> => {
  const [rows] = await connection.execute<DepartmentRow[]>(
    `SELECT
       id,
       name,
       description,
       is_active
     FROM departments
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
};

/**
 * Find a department by name
 */
const findDepartmentByName = async (
  name: string
): Promise<DepartmentRow | null> => {
  const [rows] = await pool.execute<DepartmentRow[]>(
    `SELECT
       id,
       name,
       description,
       is_active
     FROM departments
     WHERE name = ?
     LIMIT 1`,
    [name]
  );

  return rows[0] ?? null;
};

/**
 * Create a department
 */
const createDepartment = async (
  connection: PoolConnection,
  departmentData: DepartmentData
): Promise<ResultSetHeader> => {
  const { name, description, is_active } = departmentData;

  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO departments
       (name, description, is_active)
     VALUES (?, ?, ?)`,
    [name, description, is_active]
  );

  return result;
};

/**
 * Update a department
 */
const updateDepartment = async (
  connection: PoolConnection,
  id: number,
  departmentData: DepartmentData
): Promise<ResultSetHeader> => {
  const { name, description, is_active } = departmentData;

  const [result] = await connection.execute<ResultSetHeader>(
    `UPDATE departments
     SET name = ?,
         description = ?,
         is_active = ?
     WHERE id = ?`,
    [name, description, is_active, id]
  );

  return result;
};

/**
 * Delete a department
 */
const deleteDepartment = async (
  connection: PoolConnection,
  id: number
): Promise<ResultSetHeader> => {
  const [result] = await connection.execute<ResultSetHeader>(
    `DELETE FROM departments
     WHERE id = ?`,
    [id]
  );

  return result;
};

/**
 * Repository exports
 */
const departmentRepository = {
  findAllDepartments,
  findDepartmentById,
  findDepartmentByName,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

export {
  findAllDepartments,
  findDepartmentById,
  findDepartmentByName,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

export default departmentRepository;
