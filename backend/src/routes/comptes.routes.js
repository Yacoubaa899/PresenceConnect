import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    listerEtudiants, detailEtudiant, envoyerMessageEtudiant,
    listerComptesEnAttente, validerCompte, refuserCompte,
    obtenirParametres, modifierControleCompte,
    suspendreCompte, reactiverCompte,
} from "../controllers/comptes.controller.js";
import { listerProfesseurs, attribuerMatiere, retirerMatiere } from "../controllers/professeurs.controller.js";

const router = Router();

router.use(requireAuth, requireRole("administration"));

router.get("/etudiants", listerEtudiants);
router.get("/etudiants/:id", detailEtudiant);
router.post("/etudiants/:id/message", envoyerMessageEtudiant);

router.get("/professeurs", listerProfesseurs);
router.post("/professeurs/:id/matieres", attribuerMatiere);
router.delete("/professeurs/:id/matieres/:matiereId", retirerMatiere);

router.get("/comptes-en-attente", listerComptesEnAttente);
router.post("/comptes-en-attente/:id/valider", validerCompte);
router.post("/comptes-en-attente/:id/refuser", refuserCompte);

router.get("/parametres", obtenirParametres);
router.put("/parametres/controle-compte", modifierControleCompte);

router.post("/comptes/:id/suspendre", suspendreCompte);
router.post("/comptes/:id/reactiver", reactiverCompte);

export default router;