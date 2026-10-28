
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import db from "../config/database";

export type Gender = "Male" | "Female" | "Other";

export type UserFileType = "profile_picture" | "document";

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

export interface UserFileData {
  user_id: number;
  file_type: UserFileType;
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
}

export interface UserFileRow extends RowDataPacket {
  id: number;
  user_id: number;
  file_type: UserFileType;
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: Date | string;
}

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  age: number | null;
  city: string | null;
  joined_date: string | null;
  is_active: number;
  gender: Gender | null;
  department_id: number | null;
  address: string | null;
  department_name: string | null;

  file_id: number | null;
  file_type: UserFileType | null;
  original_name: string | null;
  stored_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_created_at: Date | string | null;
}

const pool: Pool = db;

/* -------------------------------------------------------------------------- */
/* Read operations                                                            */
/* -------------------------------------------------------------------------- */

const findAllUsers = async (): Promise<UserRow[]> => {
  const [rows] = await pool.query<UserRow[]>(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.age,
      u.city,
      u.joined_date,
      u.is_active,
      u.gender,
      u.department_id,
      u.address,
      d.name AS department_name,
      uf.id AS file_id,
      uf.file_type,
      uf.original_name,
      uf.stored_name,
      uf.file_path,
      uf.mime_type,
      uf.file_size,
      uf.created_at AS file_created_at
    FROM users u
    LEFT JOIN departments d
      ON u.department_id = d.id
    LEFT JOIN user_files uf
      ON u.id = uf.user_id
    ORDER BY u.id DESC
  `);

  return rows;
};

const findUserById = async (
  userId: number
): Promise<UserRow | null> => {
  const [rows] = await pool.execute<UserRow[]>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.age,
        u.city,
        u.joined_date,
        u.is_active,
        u.gender,
        u.department_id,
        u.address,
        d.name AS department_name,
        NULL AS file_id,
        NULL AS file_type,
        NULL AS original_name,
        NULL AS stored_name,
        NULL AS file_path,
        NULL AS mime_type,
        NULL AS file_size,
        NULL AS file_created_at
      FROM users u
      LEFT JOIN departments d
        ON u.department_id = d.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] ?? null;
};

const findUserFiles = async (
  userId: number,
  connection: Pool | PoolConnection = pool
): Promise<UserFileRow[]> => {
  const [rows] = await connection.execute<UserFileRow[]>(
    `
      SELECT
        id,
        user_id,
        file_type,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size,
        created_at
      FROM user_files
      WHERE user_id = ?
      ORDER BY id ASC
    `,
    [userId]
  );

  return rows;
};

const findFilesByUserIds = async (
  userIds: number[]
): Promise<UserFileRow[]> => {
  if (userIds.length === 0) {
    return [];
  }

  const placeholders = userIds.map(() => "?").join(", ");

  const [rows] = await pool.execute<UserFileRow[]>(
    `
      SELECT
        id,
        user_id,
        file_type,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size,
        created_at
      FROM user_files
      WHERE user_id IN (${placeholders})
    `,
    userIds
  );

  return rows;
};

/* -------------------------------------------------------------------------- */
/* Create operations                                                          */
/* -------------------------------------------------------------------------- */

const createUser = async (
  connection: PoolConnection,
  userData: UserData
): Promise<number> => {
  const {
    name,
    email,
    age,
    city,
    joined_date,
    is_active,
    gender,
    department_id,
    address,
  } = userData;

  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO users (
        name,
        email,
        age,
        city,
        joined_date,
        is_active,
        gender,
        department_id,
        address
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      email,
      age,
      city,
      joined_date,
      is_active,
      gender,
      department_id,
      address,
    ]
  );

  return result.insertId;
};

const createUserFile = async (
  connection: PoolConnection,
  fileData: UserFileData
): Promise<number> => {
  const {
    user_id,
    file_type,
    original_name,
    stored_name,
    file_path,
    mime_type,
    file_size,
  } = fileData;

  const [result] = await connection.execute<ResultSetHeader>(
    `
      INSERT INTO user_files (
        user_id,
        file_type,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user_id,
      file_type,
      original_name,
      stored_name,
      file_path,
      mime_type,
      file_size,
    ]
  );

  return result.insertId;
};

/* -------------------------------------------------------------------------- */
/* Update operations                                                          */
/* -------------------------------------------------------------------------- */

const updateUser = async (
  connection: PoolConnection,
  userId: number,
  userData: UserData
): Promise<ResultSetHeader> => {
  const {
    name,
    email,
    age,
    city,
    joined_date,
    is_active,
    gender,
    department_id,
    address,
  } = userData;

  const [result] = await connection.execute<ResultSetHeader>(
    `
      UPDATE users
      SET
        name = ?,
        email = ?,
        age = ?,
        city = ?,
        joined_date = ?,
        is_active = ?,
        gender = ?,
        department_id = ?,
        address = ?
      WHERE id = ?
    `,
    [
      name,
      email,
      age,
      city,
      joined_date,
      is_active,
      gender,
      department_id,
      address,
      userId,
    ]
  );

  return result;
};

/* -------------------------------------------------------------------------- */
/* Delete operations                                                          */
/* -------------------------------------------------------------------------- */

const deleteUser = async (
  connection: PoolConnection,
  userId: number
): Promise<ResultSetHeader> => {
  const [result] = await connection.execute<ResultSetHeader>(
    "DELETE FROM users WHERE id = ?",
    [userId]
  );

  return result;
};

const deleteUsers = async (
  connection: PoolConnection,
  userIds: number[]
): Promise<ResultSetHeader> => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error("At least one user ID is required.");
  }

  const placeholders = userIds.map(() => "?").join(", ");

  const [result] = await connection.execute<ResultSetHeader>(
    `DELETE FROM users WHERE id IN (${placeholders})`,
    userIds
  );

  return result;
};

const deleteUserFiles = async (
  connection: PoolConnection,
  userId: number
): Promise<ResultSetHeader> => {
  const [result] = await connection.execute<ResultSetHeader>(
    "DELETE FROM user_files WHERE user_id = ?",
    [userId]
  );

  return result;
};

/* -------------------------------------------------------------------------- */
/* Repository exports                                                         */
/* -------------------------------------------------------------------------- */

const userRepository = {
  findAllUsers,
  findUserById,
  findUserFiles,
  findFilesByUserIds,
  createUser,
  createUserFile,
  updateUser,
  deleteUser,
  deleteUsers,
  deleteUserFiles,
};

export {
  findAllUsers,
  findUserById,
  findUserFiles,
  findFilesByUserIds,
  createUser,
  createUserFile,
  updateUser,
  deleteUser,
  deleteUsers,
  deleteUserFiles,
};

export default userRepository;
