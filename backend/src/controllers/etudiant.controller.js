import { pool } from "../config/db.js";

// ============================================================
// Profil de l'étudiant connecté (dont le code parent à transmettre)
// ============================================================

export async function monProfil(req, res) {
    const [[etudiant]] = await pool.query(
        `SELECT e.nom, e.prenom, e.numero_etudiant, e.email, e.telephone, e.telephone_parent,
            e.code_parent, e.sexe, e.age, e.photo_profil, f.nom AS filiere_nom, c.nom AS classe_nom
     FROM etudiants e
     JOIN filieres f ON f.id = e.filiere_id
     JOIN classes c ON c.id = e.classe_id
     WHERE e.id = ?`,
        [req.utilisateur.id]
    );
    if (!etudiant) return res.status(404).json({ erreur: "Profil introuvable." });
    res.json(etudiant);
}

export async function modifierPhotoProfil(req, res) {
    if (!req.file) {
        return res.status(400).json({ erreur: "Aucune image reçue." });
    }
    const photo = `/uploads/${req.file.filename}`;
    await pool.query("UPDATE etudiants SET photo_profil = ? WHERE id = ?", [photo, req.utilisateur.id]);
    res.json({ message: "Photo de profil mise à jour.", photo_profil: photo });
}

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

// ============================================================
// Absences/retards de l'étudiant, pas encore justifiés (ou refusés)
// ============================================================

export async function mesAbsencesAJustifier(req, res) {
    const [absences] = await pool.query(
        `SELECT pr.session_id, pr.statut, s.date_debut, m.nom AS matiere_nom,
            p.nom AS prof_nom, p.prenom AS prof_prenom
     FROM presences pr
     JOIN sessions_cours s ON s.id = pr.session_id
     JOIN matieres m ON m.id = s.matiere_id
     JOIN professeurs p ON p.id = s.professeur_id
     WHERE pr.etudiant_id = ?
       AND pr.statut IN ('absent', 'retard')
       AND NOT EXISTS (
         SELECT 1 FROM justificatifs j
         WHERE j.session_id = pr.session_id AND j.statut != 'refuse'
       )
     ORDER BY s.date_debut DESC`,
        [req.utilisateur.id]
    );
    res.json(absences);
}

export async function mesJustificatifs(req, res) {
    const [justificatifs] = await pool.query(
        `SELECT j.*, m.nom AS matiere_nom, s.date_debut, pr.statut AS statut_presence
     FROM justificatifs j
     LEFT JOIN sessions_cours s ON s.id = j.session_id
     LEFT JOIN matieres m ON m.id = s.matiere_id
     LEFT JOIN presences pr ON pr.session_id = j.session_id AND pr.etudiant_id = j.etudiant_id
     WHERE j.etudiant_id = ?
     ORDER BY j.date_soumission DESC`,
        [req.utilisateur.id]
    );
    res.json(justificatifs);
}

export async function envoyerJustificatif(req, res) {
    const { commentaire, sessionId } = req.body;
    const fichier = req.file ? `/uploads/${req.file.filename}` : null;

    if (!sessionId) {
        return res.status(400).json({ erreur: "Merci de choisir le cours concerné par ce justificatif." });
    }
    if (!fichier) {
        return res.status(400).json({ erreur: "Un fichier justificatif est requis." });
    }

    // Vérifie que cette session correspond bien à une absence/retard de cet étudiant.
    const [[presence]] = await pool.query(
        "SELECT * FROM presences WHERE session_id = ? AND etudiant_id = ? AND statut IN ('absent','retard')",
        [sessionId, req.utilisateur.id]
    );
    if (!presence) {
        return res.status(400).json({ erreur: "Ce cours ne correspond à aucune absence ou retard de votre part." });
    }

    const [resultat] = await pool.query(
        `INSERT INTO justificatifs (etudiant_id, session_id, fichier, commentaire)
     VALUES (?, ?, ?, ?)`,
        [req.utilisateur.id, sessionId, fichier, commentaire || null]
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
        `SELECT j.*, e.nom, e.prenom, e.numero_etudiant,
            m.nom AS matiere_nom, s.date_debut,
            p.nom AS prof_nom, p.prenom AS prof_prenom,
            pr.statut AS statut_presence
     FROM justificatifs j
     JOIN etudiants e ON e.id = j.etudiant_id
     LEFT JOIN sessions_cours s ON s.id = j.session_id
     LEFT JOIN matieres m ON m.id = s.matiere_id
     LEFT JOIN professeurs p ON p.id = s.professeur_id
     LEFT JOIN presences pr ON pr.session_id = j.session_id AND pr.etudiant_id = j.etudiant_id
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