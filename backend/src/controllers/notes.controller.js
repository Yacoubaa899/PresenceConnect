import { pool } from "../config/db.js";

// ============================================================
// ADMINISTRATION — envoyer une note à un étudiant
// ============================================================

export async function envoyerNote(req, res) {
    const { etudiantId, matiereId, valeur } = req.body;

    if (!etudiantId || !matiereId || valeur === undefined || valeur === null) {
        return res.status(400).json({ erreur: "Étudiant, matière et valeur sont requis." });
    }
    const note = Number(valeur);
    if (Number.isNaN(note) || note < 0 || note > 20) {
        return res.status(400).json({ erreur: "La note doit être un nombre entre 0 et 20." });
    }

    const [resultat] = await pool.query(
        "INSERT INTO notes (etudiant_id, matiere_id, valeur, envoye_par_admin) VALUES (?, ?, ?, ?)",
        [etudiantId, matiereId, note, req.utilisateur.id]
    );

    const [[matiere]] = await pool.query("SELECT nom FROM matieres WHERE id = ?", [matiereId]);
    await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
     VALUES (?, 'note', ?, ?)`,
        [etudiantId, `Nouvelle note reçue en ${matiere?.nom || "un cours"} : ${note}/20`, resultat.insertId]
    );

    res.status(201).json({ id: resultat.insertId, message: "Note envoyée." });
}

// Notes récemment envoyées par l'admin (toutes classes confondues), pour un suivi rapide.
export async function listerNotesAdmin(req, res) {
    const [notes] = await pool.query(
        `SELECT n.id, n.valeur, n.date_envoi, e.nom, e.prenom, m.nom AS matiere_nom
     FROM notes n
     JOIN etudiants e ON e.id = n.etudiant_id
     JOIN matieres m ON m.id = n.matiere_id
     ORDER BY n.date_envoi DESC
     LIMIT 50`
    );
    res.json(notes);
}

// ============================================================
// ÉTUDIANT — ses propres notes
// ============================================================

export async function mesNotes(req, res) {
    const [notes] = await pool.query(
        `SELECT n.id, n.valeur, n.date_envoi, m.nom AS matiere_nom
     FROM notes n
     JOIN matieres m ON m.id = n.matiere_id
     WHERE n.etudiant_id = ?
     ORDER BY n.date_envoi DESC`,
        [req.utilisateur.id]
    );
    res.json(notes);
}

// ============================================================
// PARENT — notes de l'enfant suivi
// ============================================================

export async function notesEnfant(req, res) {
    const [notes] = await pool.query(
        `SELECT n.id, n.valeur, n.date_envoi, m.nom AS matiere_nom
     FROM notes n
     JOIN matieres m ON m.id = n.matiere_id
     WHERE n.etudiant_id = ?
     ORDER BY n.date_envoi DESC`,
        [req.utilisateur.etudiantId]
    );
    res.json(notes);
}