import "dotenv/config";

function requiredSecret(name: string): string {
  const value = process.env[name];

  if (!value || value.length < 32) {
    throw new Error(
      `${name} must be set to a secret of at least 32 characters.`
    );
  }

  return value;
}

export const authConfig = {
  accessSecret: requiredSecret("JWT_ACCESS_SECRET"),
  refreshSecret: requiredSecret("JWT_REFRESH_SECRET"),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshDays: Number(process.env.JWT_REFRESH_DAYS || 7),
  isProduction: process.env.NODE_ENV === "production",
};

if (
  !Number.isInteger(authConfig.refreshDays) ||
  authConfig.refreshDays < 1 ||
  authConfig.refreshDays > 30
) {
  throw new Error("JWT_REFRESH_DAYS must be an integer between 1 and 30.");
}