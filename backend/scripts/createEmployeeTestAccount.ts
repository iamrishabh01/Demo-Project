
import "dotenv/config";
import authService from "../services/authService";
import pool from "../config/database";

async function main(): Promise<void> {
  const email = "rishabh@gmail.com";
  const password = process.env.TEST_EMPLOYEE_PASSWORD;

  if (!password || password.length < 12 || password.length > 72) {
    throw new Error(
      "Set TEST_EMPLOYEE_PASSWORD in .env to a password between 12 and 72 characters."
    );
  }

  try {
    const account = await authService.createAccount(
      email,
      password,
      "Employee",
      4
    );

    console.log("Employee test account created successfully:");
    console.log({
      id: account.id,
      email: account.email,
      role: account.role,
      employeeId: account.employeeId,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Could not create Employee account:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exitCode = 1;
});
