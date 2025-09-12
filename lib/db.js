// lib/db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Root@1234",
  database: process.env.DB_NAME || "civic_connect",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
