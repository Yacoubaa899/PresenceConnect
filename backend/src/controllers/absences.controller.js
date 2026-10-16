import { pool } from "../config/db.js";

export async function listerAbsencesAdmin(req, res) {
    const { recherche, dateDebut, dateFin, filiereId } = req.query;

    let requete = `
    SELECT pr.id, s.date_debut, e.id AS etudiant_id, e.nom, e.prenom, f.nom AS filiere_nom,
           EXISTS(
             SELECT 1 FROM justificatifs j
             WHERE j.session_id = pr.session_id AND j.etudiant_id = pr.etudiant_id AND j.statut = 'valide'
           ) AS justifiee
    FROM presences pr
    JOIN etudiants e ON e.id = pr.etudiant_id
    JOIN sessions_cours s ON s.id = pr.session_id
    JOIN classes c ON c.id = e.classe_id
    JOIN filieres f ON f.id = c.filiere_id
    WHERE pr.statut = 'absent'
  `;
    const parametres = [];

    if (recherche) {
        requete += " AND (e.nom LIKE ? OR e.prenom LIKE ?)";
        const motif = `%${recherche}%`;
        parametres.push(motif, motif);
    }
    if (dateDebut) {
        requete += " AND s.date_debut >= ?";
        parametres.push(dateDebut);
    }
    if (dateFin) {
        requete += " AND s.date_debut <= ?";
        parametres.push(`${dateFin} 23:59:59`);
    }
    if (filiereId) {
        requete += " AND f.id = ?";
        parametres.push(filiereId);
    }

    requete += " ORDER BY s.date_debut DESC LIMIT 200";

    const [absences] = await pool.query(requete, parametres);
    res.json(absences.map((a) => ({ ...a, justifiee: !!a.justifiee })));
}