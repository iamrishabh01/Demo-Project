
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database";

async function main(): Promise<void> {
  const email = "rishabh@gmail.com";
  const password = process.env.TEST_EMPLOYEE_PASSWORD;

  if (!password || password.length < 12 || password.length > 72) {
    throw new Error(
      "Set TEST_EMPLOYEE_PASSWORD to a password of 12–72 characters."
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `UPDATE auth_users
       SET password_hash = ?
       WHERE email = ? AND role_id = (
         SELECT id FROM roles WHERE name = 'Employee' LIMIT 1
       )`,
      [passwordHash, email]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows !== 1) {
      throw new Error(
        "Expected exactly one Employee account to be updated."
      );
    }

    console.log("Employee test password updated successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Password reset failed."
  );
  process.exitCode = 1;
});
