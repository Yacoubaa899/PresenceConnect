import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Transforme un mot de passe / une clé en clair en une empreinte
// sécurisée à stocker en base (jamais le mot de passe lui-même).
export async function hashSecret(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

// Vérifie qu'un mot de passe / une clé saisie correspond à l'empreinte stockée.
export async function verifySecret(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

// Génère un code aléatoire de N chiffres (utilisé pour le code parent).
export function generateNumericCode(length = 4) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

// Génère une clé d'accès lisible pour un professeur/administrateur
// (avant qu'elle soit hachée pour le stockage).
export function generateAccessKey() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}