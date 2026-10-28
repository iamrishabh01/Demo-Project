
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/database";
import { authConfig } from "../config/auth";
import type {
  AuthenticatedUser,
  UserRole,
  AccessTokenPayload,
} from "../types/auth";

interface AuthAccountRow extends RowDataPacket {
  id: number;
  employee_id: number | null;
  role_id: number;
  email: string;
  password_hash: string;
  is_active: number;
  role: UserRole;
}

interface PublicAccountRow extends RowDataPacket {
  id: number;
  employee_id: number | null;
  email: string;
  is_active: number;
  role: UserRole;
}

interface RefreshTokenRow extends RowDataPacket {
  id: number;
  auth_user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface LoginResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

const toAuthenticatedUser = (
  row: AuthAccountRow | PublicAccountRow
): AuthenticatedUser => ({
  id: row.id,
  email: row.email,
  role: row.role,
  employeeId: row.employee_id,
});

const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user: AuthenticatedUser): string => {
  const payload: AccessTokenPayload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
  };

  return jwt.sign(payload, authConfig.accessSecret, {
    expiresIn: authConfig.accessExpiresIn as jwt.SignOptions["expiresIn"],
    issuer: "employee-management-api",
    audience: "employee-management-client",
  });
};

const createRefreshToken = (): string =>
  crypto.randomBytes(48).toString("base64url");

const saveRefreshToken = async (
  authUserId: number,
  refreshToken: string
): Promise<void> => {
  const tokenHash = hashRefreshToken(refreshToken);

  await pool.execute<ResultSetHeader>(
    `INSERT INTO refresh_tokens
      (auth_user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))`,
    [authUserId, tokenHash, authConfig.refreshDays]
  );
};

const findAccountByEmail = async (
  email: string
): Promise<AuthAccountRow | null> => {
  const [rows] = await pool.execute<AuthAccountRow[]>(
    `SELECT
       a.id,
       a.employee_id,
       a.role_id,
       a.email,
       a.password_hash,
       a.is_active,
       r.name AS role
     FROM auth_users a
     INNER JOIN roles r ON r.id = a.role_id
     WHERE a.email = ?
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  return rows[0] ?? null;
};

const findAccountById = async (
  authUserId: number
): Promise<PublicAccountRow | null> => {
  const [rows] = await pool.execute<PublicAccountRow[]>(
    `SELECT
       a.id,
       a.employee_id,
       a.email,
       a.is_active,
       r.name AS role
     FROM auth_users a
     INNER JOIN roles r ON r.id = a.role_id
     WHERE a.id = ?
     LIMIT 1`,
    [authUserId]
  );

  return rows[0] ?? null;
};

const login = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  const account = await findAccountByEmail(email);

  if (
    !account ||
    account.is_active !== 1 ||
    !(await bcrypt.compare(password, account.password_hash))
  ) {
    throw Object.assign(new Error("Invalid email or password."), {
      statusCode: 401,
    });
  }

  const user = toAuthenticatedUser(account);
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();

  await saveRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
};

const verifyAccessToken = (token: string): AuthenticatedUser => {
  const payload = jwt.verify(token, authConfig.accessSecret, {
    issuer: "employee-management-api",
    audience: "employee-management-client",
  }) as jwt.JwtPayload & AccessTokenPayload;

  if (
    typeof payload.sub !== "string" ||
    !Number.isSafeInteger(Number(payload.sub)) ||
    Number(payload.sub) <= 0 ||
    typeof payload.email !== "string" ||
    !["Admin", "Employee", "Guest"].includes(payload.role)
  ) {
    throw Object.assign(new Error("Invalid access token."), {
      statusCode: 401,
    });
  }

  return {
    id: Number(payload.sub),
    email: payload.email,
    role: payload.role,
    employeeId: payload.employeeId ?? null,
  };
};

const refreshSession = async (
  presentedToken: string
): Promise<LoginResult> => {
  const tokenHash = hashRefreshToken(presentedToken);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<RefreshTokenRow[]>(
      `SELECT id, auth_user_id, token_hash, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    const storedToken = rows[0];

    if (
      !storedToken ||
      storedToken.revoked_at !== null ||
      new Date(storedToken.expires_at).getTime() <= Date.now()
    ) {
      await connection.rollback();

      throw Object.assign(
        new Error("Refresh session is invalid or expired."),
        { statusCode: 401 }
      );
    }

    const [accountRows] = await connection.execute<PublicAccountRow[]>(
      `SELECT
         a.id,
         a.employee_id,
         a.email,
         a.is_active,
         r.name AS role
       FROM auth_users a
       INNER JOIN roles r ON r.id = a.role_id
       WHERE a.id = ?
       LIMIT 1`,
      [storedToken.auth_user_id]
    );

    const account = accountRows[0];

    if (!account || account.is_active !== 1) {
      await connection.execute(
        `UPDATE refresh_tokens
         SET revoked_at = UTC_TIMESTAMP()
         WHERE id = ? AND revoked_at IS NULL`,
        [storedToken.id]
      );

      await connection.commit();

      throw Object.assign(new Error("Account is inactive."), {
        statusCode: 401,
      });
    }

    await connection.execute(
      `UPDATE refresh_tokens
       SET revoked_at = UTC_TIMESTAMP()
       WHERE id = ? AND revoked_at IS NULL`,
      [storedToken.id]
    );

    const user = toAuthenticatedUser(account);
    const refreshToken = createRefreshToken();
    const accessToken = createAccessToken(user);

    await connection.execute(
      `INSERT INTO refresh_tokens
        (auth_user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))`,
      [
        user.id,
        hashRefreshToken(refreshToken),
        authConfig.refreshDays,
      ]
    );

    await connection.commit();

    return { user, accessToken, refreshToken };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // Transaction may already have ended.
      }
    }

    throw error;
  } finally {
    connection.release();
  }
};

const logout = async (presentedToken: string): Promise<void> => {
  await pool.execute(
    `UPDATE refresh_tokens
     SET revoked_at = UTC_TIMESTAMP()
     WHERE token_hash = ? AND revoked_at IS NULL`,
    [hashRefreshToken(presentedToken)]
  );
};

const getCurrentUser = async (
  authUserId: number
): Promise<AuthenticatedUser> => {
  const account = await findAccountById(authUserId);

  if (!account || account.is_active !== 1) {
    throw Object.assign(new Error("Account not found or inactive."), {
      statusCode: 401,
    });
  }

  return toAuthenticatedUser(account);
};

const createAccount = async (
  email: string,
  password: string,
  role: UserRole,
  employeeId: number | null
): Promise<AuthenticatedUser> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (password.length < 12 || password.length > 72) {
    throw Object.assign(
      new Error("Password must contain between 12 and 72 characters."),
      { statusCode: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [roleRows] = await connection.execute<
      (RowDataPacket & { id: number; name: UserRole })[]
    >(
      "SELECT id, name FROM roles WHERE name = ? LIMIT 1",
      [role]
    );

    const roleRow = roleRows[0];

    if (!roleRow) {
      throw Object.assign(new Error("Invalid role."), {
        statusCode: 400,
      });
    }

    if (employeeId !== null) {
      const [employeeRows] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [employeeId]
      );

      if (employeeRows.length === 0) {
        throw Object.assign(new Error("Employee record not found."), {
          statusCode: 404,
        });
      }
    }

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO auth_users
        (employee_id, role_id, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [employeeId, roleRow.id, normalizedEmail, passwordHash]
    );

    await connection.commit();

    return {
      id: result.insertId,
      email: normalizedEmail,
      role,
      employeeId,
    };
  } catch (error) {
    await connection.rollback();

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      throw Object.assign(
        new Error("An account already exists for this email or employee."),
        { statusCode: 409 }
      );
    }

    throw error;
  } finally {
    connection.release();
  }
};

const authService = {
  login,
  verifyAccessToken,
  refreshSession,
  logout,
  getCurrentUser,
  createAccount,
};

export default authService;
