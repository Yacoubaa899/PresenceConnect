import { pool } from "../config/db.js";

// ============================================================
// Statistiques d'assiduité de l'étudiant connecté
// ============================================================

export async function mesStatistiques(req, res) {
    const [[totaux]] = await pool.query(
        `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) AS presents,
       SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) AS retards,
       SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) AS absents
     FROM presences
     WHERE etudiant_id = ?`,
        [req.utilisateur.id]
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

// ============================================================
// Historique complet des présences de l'étudiant, par matière
// ============================================================

export async function monHistorique(req, res) {
    const [historique] = await pool.query(
        `SELECT pr.statut, pr.heure_validation, m.nom AS matiere_nom, s.date_debut
     FROM presences pr
     JOIN sessions_cours s ON s.id = pr.session_id
     JOIN matieres m ON m.id = s.matiere_id
     WHERE pr.etudiant_id = ?
     ORDER BY s.date_debut DESC
     LIMIT 100`,
        [req.utilisateur.id]
    );
    res.json(historique);
}

// ============================================================
// Justificatifs — envoi et suivi par l'étudiant
// ============================================================

export async function mesJustificatifs(req, res) {
    const [justificatifs] = await pool.query(
        "SELECT * FROM justificatifs WHERE etudiant_id = ? ORDER BY date_soumission DESC",
        [req.utilisateur.id]
    );
    res.json(justificatifs);
}

export async function envoyerJustificatif(req, res) {
    const { commentaire, sessionId } = req.body;
    const fichier = req.file ? `/uploads/${req.file.filename}` : null;

    if (!fichier) {
        return res.status(400).json({ erreur: "Un fichier justificatif est requis." });
    }

    const [resultat] = await pool.query(
        `INSERT INTO justificatifs (etudiant_id, session_id, fichier, commentaire)
     VALUES (?, ?, ?, ?)`,
        [req.utilisateur.id, sessionId || null, fichier, commentaire || null]
    );

    // Prévenir l'administration.
    const [admins] = await pool.query("SELECT id FROM administrateurs");
    for (const admin of admins) {
        await pool.query(
            `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
       VALUES (?, 'justificatif', ?, ?)`,
            [admin.id, "Nouveau justificatif d'absence à traiter.", resultat.insertId]
        );
    }

    res.status(201).json({ id: resultat.insertId, message: "Justificatif envoyé." });
}

// ============================================================
// ADMINISTRATION — validation / refus des justificatifs
// ============================================================

export async function listerJustificatifsAdmin(req, res) {
    const [justificatifs] = await pool.query(
        `SELECT j.*, e.nom, e.prenom, e.numero_etudiant
     FROM justificatifs j
     JOIN etudiants e ON e.id = j.etudiant_id
     ORDER BY j.date_soumission DESC`
    );
    res.json(justificatifs);
}

export async function traiterJustificatif(req, res) {
    const { id } = req.params;
    const { decision } = req.body; // "valide" ou "refuse"

    if (!["valide", "refuse"].includes(decision)) {
        return res.status(400).json({ erreur: "Décision invalide." });
    }

    const [[justificatif]] = await pool.query("SELECT * FROM justificatifs WHERE id = ?", [id]);
    if (!justificatif) return res.status(404).json({ erreur: "Justificatif introuvable." });

    await pool.query(
        "UPDATE justificatifs SET statut = ?, traite_par_admin = ? WHERE id = ?",
        [decision, req.utilisateur.id, id]
    );

    await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
     VALUES (?, 'justificatif_traite', ?, ?)`,
        [
            justificatif.etudiant_id,
            decision === "valide" ? "Votre justificatif a été validé." : "Votre justificatif a été refusé.",
            id,
        ]
    );

    res.json({ message: "Justificatif traité." });
}