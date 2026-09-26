import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadPublication } from "../config/upload.js";
import {
    monProfil,
    modifierPhotoProfil,
    mesStatistiques,
    monHistorique,
    mesAbsencesAJustifier,
    mesJustificatifs,
    envoyerJustificatif,
    listerJustificatifsAdmin,
    traiterJustificatif,
} from "../controllers/etudiant.controller.js";

const router = Router();

// Étudiant : ses propres statistiques, historique, justificatifs.
router.get("/mon-profil", requireAuth, requireRole("etudiant"), monProfil);
router.post("/mon-profil/photo", requireAuth, requireRole("etudiant"), uploadPublication.single("photo"), modifierPhotoProfil);
router.get("/mes-statistiques", requireAuth, requireRole("etudiant"), mesStatistiques);
router.get("/mes-absences-a-justifier", requireAuth, requireRole("etudiant"), mesAbsencesAJustifier);
router.get("/mon-historique", requireAuth, requireRole("etudiant"), monHistorique);
router.get("/mes-justificatifs", requireAuth, requireRole("etudiant"), mesJustificatifs);
router.post(
    "/justificatifs",
    requireAuth,
    requireRole("etudiant"),
    uploadPublication.single("fichier"),
    envoyerJustificatif
);

// Administration : liste et traitement des justificatifs de tous les étudiants.
router.get("/administration/justificatifs", requireAuth, requireRole("administration"), listerJustificatifsAdmin);
router.post("/administration/justificatifs/:id/traiter", requireAuth, requireRole("administration"), traiterJustificatif);

export default router;