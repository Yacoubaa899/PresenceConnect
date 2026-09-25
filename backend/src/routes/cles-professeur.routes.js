import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    genererCleProfesseur,
    listerClesProfesseur,
    verifierCleEnrolement,
    activerCompteProfesseur,
} from "../controllers/cles-professeur.controller.js";

const router = Router();

// Réservé à l'administration : générer et consulter les clés.
router.post(
    "/administration/cles-professeur",
    requireAuth,
    requireRole("administration"),
    genererCleProfesseur
);
router.get(
    "/administration/cles-professeur",
    requireAuth,
    requireRole("administration"),
    listerClesProfesseur
);

// Accessible sans compte : un futur professeur vérifie/utilise sa clé.
router.post("/professeur/verifier-cle", verifierCleEnrolement);
router.post("/professeur/activer-compte", activerCompteProfesseur);

export default router;