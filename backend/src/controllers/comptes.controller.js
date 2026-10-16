import { pool } from "../config/db.js";

// ============================================================
// LISTE ET RECHERCHE DES COMPTES ÉTUDIANTS
// ============================================================

export async function listerEtudiants(req, res) {
    const { recherche, filiereId } = req.query;

    let requete = `
    SELECT e.id, e.nom, e.prenom, e.numero_etudiant, e.email, e.compte_valide,
           u.actif, f.nom AS filiere_nom, c.nom AS classe_nom
    FROM etudiants e
    JOIN utilisateurs u ON u.id = e.id
    JOIN filieres f ON f.id = e.filiere_id
    JOIN classes c ON c.id = e.classe_id
    WHERE 1 = 1
  `;
    const parametres = [];

    if (recherche) {
        requete += " AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.numero_etudiant LIKE ?)";
        const motif = `%${recherche}%`;
        parametres.push(motif, motif, motif);
    }
    if (filiereId) {
        requete += " AND e.filiere_id = ?";
        parametres.push(filiereId);
    }
    requete += " ORDER BY e.nom, e.prenom";

    const [etudiants] = await pool.query(requete, parametres);
    res.json(etudiants);
}

// Liste unifiée étudiants + professeurs, pour la page "Activation des comptes".
// (L'administration est un compte unique fixe, et le parent n'a pas de compte
// propre — ils ne figurent donc pas dans cette liste.)
export async function listerComptesTous(req, res) {
    const { recherche, role } = req.query;
    const motif = recherche ? `%${recherche}%` : "%";

    const comptes = [];

    if (!role || role === "etudiant") {
        const [etudiants] = await pool.query(
            `SELECT e.id, e.nom, e.prenom, e.email, u.actif, e.compte_valide
       FROM etudiants e JOIN utilisateurs u ON u.id = e.id
       WHERE e.nom LIKE ? OR e.prenom LIKE ? OR e.email LIKE ?`,
            [motif, motif, motif]
        );
        etudiants.forEach((e) => comptes.push({
            id: e.id, nom: e.nom, prenom: e.prenom, email: e.email, role: "etudiant",
            statut: !e.compte_valide ? "en_attente" : (e.actif ? "actif" : "desactive"),
        }));
    }

    if (!role || role === "professeur") {
        const [professeurs] = await pool.query(
            `SELECT p.id, p.nom, p.prenom, u.actif
       FROM professeurs p JOIN utilisateurs u ON u.id = p.id
       WHERE p.nom LIKE ? OR p.prenom LIKE ?`,
            [motif, motif]
        );
        professeurs.forEach((p) => comptes.push({
            id: p.id, nom: p.nom, prenom: p.prenom, email: null, role: "professeur",
            statut: p.actif ? "actif" : "desactive",
        }));
    }

    res.json(comptes);
}

export async function detailEtudiant(req, res) {
    const { id } = req.params;
    const [[etudiant]] = await pool.query(
        `SELECT e.*, u.actif, f.nom AS filiere_nom, c.nom AS classe_nom
     FROM etudiants e
     JOIN utilisateurs u ON u.id = e.id
     JOIN filieres f ON f.id = e.filiere_id
     JOIN classes c ON c.id = e.classe_id
     WHERE e.id = ?`,
        [id]
    );
    if (!etudiant) return res.status(404).json({ erreur: "Étudiant introuvable." });

    delete etudiant.mot_de_passe_hash; // jamais renvoyé, même haché
    res.json(etudiant);
}

// Envoi d'un message de l'administration à un étudiant (via notification).
export async function envoyerMessageEtudiant(req, res) {
    const { id } = req.params;
    const { contenu } = req.body;
    if (!contenu || !contenu.trim()) {
        return res.status(400).json({ erreur: "Le message ne peut pas être vide." });
    }

    const [[etudiant]] = await pool.query("SELECT id FROM etudiants WHERE id = ?", [id]);
    if (!etudiant) return res.status(404).json({ erreur: "Étudiant introuvable." });

    await pool.query(
        "INSERT INTO notifications (utilisateur_id, type, contenu) VALUES (?, 'message_admin', ?)",
        [id, contenu]
    );

    res.status(201).json({ message: "Message envoyé." });
}

// ============================================================
// COMPTES EN ATTENTE DE VALIDATION
// ============================================================

export async function listerComptesEnAttente(req, res) {
    const [comptes] = await pool.query(
        `SELECT e.id, e.nom, e.prenom, e.numero_etudiant, f.nom AS filiere_nom, c.nom AS classe_nom
     FROM etudiants e
     JOIN filieres f ON f.id = e.filiere_id
     JOIN classes c ON c.id = e.classe_id
     WHERE e.compte_valide = FALSE
     ORDER BY e.id DESC`
    );
    res.json(comptes);
}

export async function validerCompte(req, res) {
    const { id } = req.params;
    await pool.query("UPDATE etudiants SET compte_valide = TRUE WHERE id = ?", [id]);
    res.json({ message: "Compte validé." });
}

export async function refuserCompte(req, res) {
    const { id } = req.params;
    // On supprime le compte refusé (utilisateurs -> etudiants en cascade).
    await pool.query("DELETE FROM utilisateurs WHERE id = ?", [id]);
    res.json({ message: "Compte refusé et supprimé." });
}

// ============================================================
// RÉGLAGE DU CONTRÔLE DE COMPTE (activer/désactiver la validation admin)
// ============================================================

export async function obtenirParametres(req, res) {
    const [[parametres]] = await pool.query("SELECT * FROM parametres_admin WHERE id = 1");
    res.json(parametres);
}

export async function modifierControleCompte(req, res) {
    const { actif } = req.body;
    if (typeof actif !== "boolean") {
        return res.status(400).json({ erreur: "Le champ 'actif' doit être vrai ou faux." });
    }
    await pool.query("UPDATE parametres_admin SET controle_compte_actif = ? WHERE id = 1", [actif]);
    res.json({ message: "Réglage mis à jour.", controleCompteActif: actif });
}

// ============================================================
// SUSPENSION / RÉACTIVATION D'UN COMPTE (tous rôles)
// ============================================================

export async function suspendreCompte(req, res) {
    const { id } = req.params;
    await pool.query("UPDATE utilisateurs SET actif = FALSE WHERE id = ?", [id]);
    res.json({ message: "Compte suspendu." });
}

export async function reactiverCompte(req, res) {
    const { id } = req.params;
    await pool.query("UPDATE utilisateurs SET actif = TRUE WHERE id = ?", [id]);
    res.json({ message: "Compte réactivé." });
}