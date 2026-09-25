import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    demarrerSession,
    detailSession,
    sessionOuvertePourEtudiant,
    validerPresenceParMotDePasse,
    marquerPresenceManuelle,
    cloturerSession,
    mesMatieres,
    maSessionOuverte,
    envoyerFichePresence,
} from "../controllers/sessions.controller.js";

const router = Router();

router.use(requireAuth);

// Étudiant : savoir si une session est ouverte pour sa classe.
router.get("/ouverte-pour-moi", requireRole("etudiant"), sessionOuvertePourEtudiant);

// Professeur : gestion complète de ses sessions.
router.get("/mes-matieres", requireRole("professeur"), mesMatieres);
router.get("/ma-session-ouverte", requireRole("professeur"), maSessionOuverte);
router.post("/demarrer", requireRole("professeur"), demarrerSession);
router.get("/:id", requireRole("professeur"), detailSession);
router.post("/:id/valider-mot-de-passe", requireRole("professeur"), validerPresenceParMotDePasse);
router.post("/:id/marquer-manuel", requireRole("professeur"), marquerPresenceManuelle);
router.post("/:id/cloturer", requireRole("professeur"), cloturerSession);
router.post("/:id/envoyer", requireRole("professeur"), envoyerFichePresence);

export default router;