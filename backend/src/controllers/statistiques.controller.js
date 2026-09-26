import { pool } from "../config/db.js";

// ============================================================
// Statistiques globales, filtrables par filière / classe / matière.
// ============================================================

export async function statistiquesGlobales(req, res) {
    const { filiereId, classeId, matiereId } = req.query;

    let requete = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN pr.statut = 'present' THEN 1 ELSE 0 END) AS presents,
      SUM(CASE WHEN pr.statut = 'retard' THEN 1 ELSE 0 END) AS retards,
      SUM(CASE WHEN pr.statut = 'absent' THEN 1 ELSE 0 END) AS absents
    FROM presences pr
    JOIN sessions_cours s ON s.id = pr.session_id
    JOIN classes c ON c.id = s.classe_id
    WHERE 1 = 1
  `;
    const parametres = [];

    if (filiereId) {
        requete += " AND c.filiere_id = ?";
        parametres.push(filiereId);
    }
    if (classeId) {
        requete += " AND s.classe_id = ?";
        parametres.push(classeId);
    }
    if (matiereId) {
        requete += " AND s.matiere_id = ?";
        parametres.push(matiereId);
    }

    const [[totaux]] = await pool.query(requete, parametres);
    const total = totaux.total || 0;
    const pourcentage = total > 0
        ? Math.round(((totaux.presents + totaux.retards) / total) * 100)
        : 0;

    res.json({
        total,
        presents: totaux.presents || 0,
        retards: totaux.retards || 0,
        absents: totaux.absents || 0,
        pourcentageAssiduite: pourcentage,
    });
}

// ============================================================
// Répartition par filière, pour une vue d'ensemble rapide.
// ============================================================

export async function statistiquesParFiliere(req, res) {
    const [lignes] = await pool.query(`
    SELECT
      f.id, f.nom,
      COUNT(pr.id) AS total,
      SUM(CASE WHEN pr.statut IN ('present','retard') THEN 1 ELSE 0 END) AS assidus
    FROM filieres f
    LEFT JOIN classes c ON c.filiere_id = f.id
    LEFT JOIN sessions_cours s ON s.classe_id = c.id
    LEFT JOIN presences pr ON pr.session_id = s.id
    GROUP BY f.id
    ORDER BY f.nom
  `);

    const resultat = lignes.map((l) => ({
        id: l.id,
        nom: l.nom,
        pourcentageAssiduite: l.total > 0 ? Math.round((l.assidus / l.total) * 100) : 0,
        total: l.total,
    }));

    res.json(resultat);
}