import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    listerFilieres, creerFiliere, modifierFiliere, supprimerFiliere,
    listerClasses, creerClasse, modifierClasse, supprimerClasse,
    listerMatieres, creerMatiere, modifierMatiere, supprimerMatiere,
} from "../controllers/structure.controller.js";

const router = Router();

// Lecture publique : nécessaire pour remplir les menus déroulants
// du formulaire d'inscription étudiant (avant qu'il ait un compte).
router.get("/filieres", listerFilieres);
router.get("/classes", listerClasses);
router.get("/matieres", listerMatieres);

// Création / modification / suppression : réservées à l'administration.
router.use(requireAuth, requireRole("administration"));

router.post("/filieres", creerFiliere);
router.put("/filieres/:id", modifierFiliere);
router.delete("/filieres/:id", supprimerFiliere);

router.post("/classes", creerClasse);
router.put("/classes/:id", modifierClasse);
router.delete("/classes/:id", supprimerClasse);

router.post("/matieres", creerMatiere);
router.put("/matieres/:id", modifierMatiere);
router.delete("/matieres/:id", supprimerMatiere);

export default router;