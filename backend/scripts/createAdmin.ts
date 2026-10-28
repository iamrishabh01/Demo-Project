
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database";

async function createAdmin(): Promise<void> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in your backend .env file."
    );
  }

  if (password.length < 12) {
    throw new Error("Admin password must be at least 12 characters long.");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Prevent running bootstrap if any Admin account already exists.
    const [admins] = await connection.execute(
      `SELECT au.id
       FROM auth_users au
       JOIN roles r ON r.id = au.role_id
       WHERE r.name = 'Admin'
       LIMIT 1
       FOR UPDATE`
    );

    if ((admins as Array<{ id: number }>).length > 0) {
      throw new Error(
        "An Admin account already exists. Bootstrap has been stopped."
      );
    }

    const [existing] = await connection.execute(
      "SELECT id FROM auth_users WHERE email = ? LIMIT 1",
      [email]
    );

    if ((existing as Array<{ id: number }>).length > 0) {
      throw new Error("This email already belongs to an authentication account.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO auth_users
         (employee_id, role_id, email, password_hash, is_active)
       VALUES (NULL, ?, ?, ?, 1)`,
      [1, email, passwordHash]
    );

    await connection.commit();

    console.log(`Admin account created successfully for ${email}.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

createAdmin().catch((error: unknown) => {
  console.error(
    "Admin bootstrap failed:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exitCode = 1;
});
