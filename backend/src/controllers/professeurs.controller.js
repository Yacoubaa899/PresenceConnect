import { pool } from "../config/db.js";

export async function listerProfesseurs(req, res) {
    const [professeurs] = await pool.query(
        `SELECT p.id, p.nom, p.prenom, p.licence, p.nombre_heures, u.actif, f.nom AS filiere_nom
     FROM professeurs p
     JOIN utilisateurs u ON u.id = p.id
     JOIN filieres f ON f.id = p.filiere_id
     ORDER BY p.nom, p.prenom`
    );

    // Ajoute la liste des matières dispensées par chaque professeur.
    for (const prof of professeurs) {
        const [matieres] = await pool.query(
            `SELECT m.id, m.nom FROM professeurs_matieres pm
       JOIN matieres m ON m.id = pm.matiere_id
       WHERE pm.professeur_id = ?`,
            [prof.id]
        );
        prof.matieres = matieres;
    }

    res.json(professeurs);
}

export async function attribuerMatiere(req, res) {
    const { id } = req.params;
    const { matiereId } = req.body;
    if (!matiereId) return res.status(400).json({ erreur: "La matière est requise." });

    await pool.query(
        "INSERT IGNORE INTO professeurs_matieres (professeur_id, matiere_id) VALUES (?, ?)",
        [id, matiereId]
    );
    res.status(201).json({ message: "Matière attribuée." });
}

export async function retirerMatiere(req, res) {
    const { id, matiereId } = req.params;
    await pool.query(
        "DELETE FROM professeurs_matieres WHERE professeur_id = ? AND matiere_id = ?",
        [id, matiereId]
    );
    res.json({ message: "Matière retirée." });
}