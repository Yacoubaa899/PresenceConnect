import { verifyToken } from "../utils/jwt.js";

// Vérifie que la requête porte un token valide (utilisateur connecté).
export function requireAuth(req, res, next) {
  const entete = req.headers.authorization;
  if (!entete || !entete.startsWith("Bearer ")) {
    return res.status(401).json({ erreur: "Connexion requise." });
  }

  const token = entete.replace("Bearer ", "");
  try {
    req.utilisateur = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ erreur: "Session invalide ou expirée." });
  }
}

// À utiliser après requireAuth pour limiter une route à certains rôles.
// Exemple : router.get("/admin/comptes", requireAuth, requireRole("administration"), ...)
export function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!rolesAutorises.includes(req.utilisateur.role)) {
      return res.status(403).json({ erreur: "Accès non autorisé pour ce rôle." });
    }
    next();
  };
}