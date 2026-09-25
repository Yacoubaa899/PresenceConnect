import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Le token contient l'identité et le rôle de l'utilisateur connecté.
// Il est renvoyé au front-end après une connexion réussie, puis
// renvoyé par le front-end dans chaque requête pour prouver qui il est.
export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}