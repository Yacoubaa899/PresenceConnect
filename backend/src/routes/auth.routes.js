import { Router } from "express";
import {
  registerStudent,
  loginStudent,
  loginAdmin,
  loginTeacher,
  loginParent,
  changerCleAdmin,
  demanderReinitialisation,
  reinitialiserMotDePasse,
} from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Inscription — réservée aux étudiants (seul rôle avec inscription libre).
router.post("/inscription", registerStudent);

// Connexion — une route par rôle, car chaque rôle a des identifiants différents.
router.post("/connexion/etudiant", loginStudent);
router.post("/connexion/administration", loginAdmin);
router.post("/connexion/professeur", loginTeacher);
router.post("/connexion/parent", loginParent);

// Mot de passe oublié (étudiant).
router.post("/mot-de-passe-oublie", demanderReinitialisation);
router.post("/reinitialiser-mot-de-passe", reinitialiserMotDePasse);

// Modification de la clé d'accès — réservée à l'administration connectée.
router.put(
  "/administration/cle-acces",
  requireAuth,
  requireRole("administration"),
  changerCleAdmin
);

export default router;