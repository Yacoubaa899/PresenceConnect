// À exécuter UNE SEULE FOIS, juste après avoir créé les tables (schema.sql) :
//   node scripts/seed-admin.js
//
// Crée le compte administration par défaut avec la clé d'accès initiale.
// Pense à changer cette clé depuis l'application juste après.

import dotenv from "dotenv";
dotenv.config();

import { pool } from "../src/config/db.js";
import { hashSecret } from "../src/utils/hash.js";

const NOM_ADMIN = "Admin";
const PRENOM_ADMIN = "Admin";
const CLE_PAR_DEFAUT = "Admin-1234"; // ⚠️ à remplacer avant la mise en production

async function seed() {
  const connection = await pool.getConnection();
  try {
    const [existants] = await connection.query("SELECT id FROM administrateurs");
    if (existants.length > 0) {
      console.log("Un compte administration existe déjà. Rien à faire.");
      return;
    }

    const cleHash = await hashSecret(CLE_PAR_DEFAUT);

    await connection.beginTransaction();
    const [utilisateur] = await connection.query(
      "INSERT INTO utilisateurs (role) VALUES ('administration')"
    );
    await connection.query(
      "INSERT INTO administrateurs (id, nom, prenom, cle_acces_hash) VALUES (?, ?, ?, ?)",
      [utilisateur.insertId, NOM_ADMIN, PRENOM_ADMIN, cleHash]
    );
    await connection.commit();

    console.log("Compte administration créé.");
    console.log(`Clé d'accès par défaut : ${CLE_PAR_DEFAUT}`);
    console.log("Connectez-vous puis changez cette clé immédiatement.");
  } catch (erreur) {
    await connection.rollback();
    console.error(erreur);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();