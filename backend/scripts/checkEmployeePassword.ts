
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database";

async function main(): Promise<void> {
  const email = "rishabh@gmail.com";
  const password = process.env.TEST_EMPLOYEE_PASSWORD;

  if (!password) {
    throw new Error(
      "TEST_EMPLOYEE_PASSWORD is missing from your backend .env file."
    );
  }

  try {
    const [rows] = await pool.execute(
      `SELECT password_hash
       FROM auth_users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const accounts = rows as { password_hash: string }[];

    if (accounts.length === 0) {
      console.log("Account not found.");
      return;
    }

    const matches = await bcrypt.compare(
      password,
      accounts[0].password_hash
    );

    console.log(
      matches
        ? "Password matches the stored hash."
        : "Password DOES NOT match the stored hash."
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Password check failed."
  );
  process.exitCode = 1;
});
