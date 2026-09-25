import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadPublication } from "../config/upload.js";
import {
    listerPublications,
    creerPublicationAdmin,
    creerPublicationProfesseur,
    listerPublicationsProgrammees,
    modifierPublicationProgrammee,
    supprimerPublication,
} from "../controllers/publications.controller.js";

const router = Router();

// Lecture : tous les rôles connectés peuvent consulter une catégorie.
router.get("/:categorie", requireAuth, listerPublications);

// Publications programmées, pas encore en ligne : admin et prof, sur leurs propres publications.
router.get(
    "/programmees/:categorie",
    requireAuth,
    requireRole("administration", "professeur"),
    listerPublicationsProgrammees
);
router.put(
    "/:id",
    requireAuth,
    requireRole("administration", "professeur"),
    uploadPublication.single("fichier"),
    modifierPublicationProgrammee
);

// Création : admin sur les 3 catégories, prof uniquement sur bibliothèque.
// uploadPublication.single("fichier") lit le fichier envoyé (champ "fichier")
// s'il y en a un ; les publications en texte simple n'en envoient pas.
router.post("/admin", requireAuth, requireRole("administration"), uploadPublication.single("fichier"), creerPublicationAdmin);
router.post("/professeur", requireAuth, requireRole("professeur"), uploadPublication.single("fichier"), creerPublicationProfesseur);

// Suppression : admin ou prof auteur (vérifié dans le contrôleur).
router.delete("/:id", requireAuth, requireRole("administration", "professeur"), supprimerPublication);

export default router;