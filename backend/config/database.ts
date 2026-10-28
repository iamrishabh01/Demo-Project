
import "dotenv/config";
import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",

  user: process.env.DB_USER || "root",

  password: process.env.DB_PASSWORD || "",

  database: process.env.DB_NAME || "user_management",

  waitForConnections: true,

  connectionLimit:
    Number(process.env.DB_CONNECTION_LIMIT) || 10,

  queueLimit: 0,

  timezone: "Z",
});

export default pool;
