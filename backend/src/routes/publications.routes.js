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

// Accepte deux fichiers possibles : le contenu lui-même ("fichier",
// une image ou un PDF) et, pour un PDF, une photo de couverture
// facultative ("photoCouverture").
const deuxFichiers = uploadPublication.fields([
    { name: "fichier", maxCount: 1 },
    { name: "photoCouverture", maxCount: 1 },
]);

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
    deuxFichiers,
    modifierPublicationProgrammee
);

// Création : admin sur les 3 catégories, prof uniquement sur bibliothèque.
router.post("/admin", requireAuth, requireRole("administration"), deuxFichiers, creerPublicationAdmin);
router.post("/professeur", requireAuth, requireRole("professeur"), deuxFichiers, creerPublicationProfesseur);

// Suppression : admin ou prof auteur (vérifié dans le contrôleur).
router.delete("/:id", requireAuth, requireRole("administration", "professeur"), supprimerPublication);

export default router;