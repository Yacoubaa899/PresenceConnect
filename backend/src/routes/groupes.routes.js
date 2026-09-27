import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadPublication } from "../config/upload.js";
import {
    listerGroupes,
    creerGroupe,
    demanderAdhesion,
    listerDemandesAdhesion,
    traiterDemandeAdhesion,
    detailGroupe,
    rechercherEtudiants,
    inviterDansGroupe,
    mesInvitations,
    repondreInvitation,
    listerMessages,
    envoyerMessage,
    quitterGroupe,
} from "../controllers/groupes.controller.js";

const router = Router();

// IMPORTANT : ce routeur est monté sur le préfixe partagé "/api" (comme
// plusieurs autres). Un "router.use(requireRole(...))" sans chemin
// s'appliquerait à TOUTE requête passant par "/api", même celles
// destinées à d'autres routeurs enregistrés après lui (ex: les notes de
// l'administration) — bloquant à tort les autres rôles. On applique donc
// requireAuth/requireRole route par route, jamais en bloc ici.

router.get("/groupes", requireAuth, requireRole("etudiant"), listerGroupes);
router.post("/groupes", requireAuth, requireRole("etudiant"), uploadPublication.single("photo"), creerGroupe);
router.get("/groupes/recherche-etudiants", requireAuth, requireRole("etudiant"), rechercherEtudiants);
router.get("/groupes/:id", requireAuth, requireRole("etudiant"), detailGroupe);

router.post("/groupes/:id/demande-adhesion", requireAuth, requireRole("etudiant"), demanderAdhesion);
router.get("/groupes/:id/demandes-adhesion", requireAuth, requireRole("etudiant"), listerDemandesAdhesion);
router.post("/groupes/:id/demandes-adhesion/:demandeId", requireAuth, requireRole("etudiant"), traiterDemandeAdhesion);

router.post("/groupes/:id/inviter", requireAuth, requireRole("etudiant"), inviterDansGroupe);
router.post("/groupes/:id/quitter", requireAuth, requireRole("etudiant"), quitterGroupe);

router.get("/groupes/:id/messages", requireAuth, requireRole("etudiant"), listerMessages);
router.post("/groupes/:id/messages", requireAuth, requireRole("etudiant"), uploadPublication.single("fichier"), envoyerMessage);

router.get("/invitations", requireAuth, requireRole("etudiant"), mesInvitations);
router.post("/invitations/:id/repondre", requireAuth, requireRole("etudiant"), repondreInvitation);

export default router;