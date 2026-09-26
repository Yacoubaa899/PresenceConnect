import { pool } from "../config/db.js";

// Le token du parent contient etudiantId (l'enfant suivi), pas d'id de compte propre.

export async function monEnfant(req, res) {
    const [[enfant]] = await pool.query(
        `SELECT e.id, e.nom, e.prenom, f.nom AS filiere_nom, c.nom AS classe_nom
     FROM etudiants e
     JOIN filieres f ON f.id = e.filiere_id
     JOIN classes c ON c.id = e.classe_id
     WHERE e.id = ?`,
        [req.utilisateur.etudiantId]
    );
    if (!enfant) return res.status(404).json({ erreur: "Étudiant introuvable." });
    res.json(enfant);
}

export async function statistiquesEnfant(req, res) {
    const [[totaux]] = await pool.query(
        `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) AS presents,
       SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) AS retards,
       SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) AS absents
     FROM presences
     WHERE etudiant_id = ?`,
        [req.utilisateur.etudiantId]
    );

    const total = totaux.total || 0;
    const pourcentageAssiduite = total > 0
        ? Math.round(((totaux.presents + totaux.retards) / total) * 100)
        : 100;

    res.json({
        total,
        presents: totaux.presents || 0,
        retards: totaux.retards || 0,
        absents: totaux.absents || 0,
        pourcentageAssiduite,
    });
}

export async function historiqueEnfant(req, res) {
    const [historique] = await pool.query(
        `SELECT pr.statut, s.date_debut, m.nom AS matiere_nom
     FROM presences pr
     JOIN sessions_cours s ON s.id = pr.session_id
     JOIN matieres m ON m.id = s.matiere_id
     WHERE pr.etudiant_id = ?
     ORDER BY s.date_debut DESC
     LIMIT 30`,
        [req.utilisateur.etudiantId]
    );
    res.json(historique);
}