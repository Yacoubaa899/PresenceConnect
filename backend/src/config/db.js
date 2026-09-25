import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Un "pool" garde plusieurs connexions ouvertes et prêtes à l'emploi,
// plutôt que d'en ouvrir une nouvelle à chaque requête (plus rapide).
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});