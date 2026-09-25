import PDFDocument from "pdfkit";
import { pool } from "../config/db.js";

// ============================================================
// Liste des sessions clôturées (une fiche = un cours donné, à une
// date/heure précise, pour une classe précise).
// ============================================================

export async function listerFiches(req, res) {
    const { filiereId, classeId } = req.query;

    let requete = `
    SELECT s.id, s.date_debut, s.date_fin, s.heures_effectuees,
           m.nom AS matiere_nom, c.nom AS classe_nom, f.id AS filiere_id, f.nom AS filiere_nom,
           p.nom AS prof_nom, p.prenom AS prof_prenom,
           SUM(CASE WHEN pr.statut = 'present' THEN 1 ELSE 0 END) AS total_present,
           SUM(CASE WHEN pr.statut = 'retard' THEN 1 ELSE 0 END) AS total_retard,
           SUM(CASE WHEN pr.statut = 'absent' THEN 1 ELSE 0 END) AS total_absent
    FROM sessions_cours s
    JOIN matieres m ON m.id = s.matiere_id
    JOIN classes c ON c.id = s.classe_id
    JOIN filieres f ON f.id = c.filiere_id
    JOIN professeurs p ON p.id = s.professeur_id
    LEFT JOIN presences pr ON pr.session_id = s.id
    WHERE s.statut = 'cloturee'
  `;
    const parametres = [];

    if (filiereId) {
        requete += " AND f.id = ?";
        parametres.push(filiereId);
    }
    if (classeId) {
        requete += " AND c.id = ?";
        parametres.push(classeId);
    }

    requete += " GROUP BY s.id ORDER BY s.date_debut DESC";

    const [fiches] = await pool.query(requete, parametres);
    res.json(fiches);
}

// ============================================================
// Détail d'une fiche : la liste complète des étudiants et leur statut.
// ============================================================

export async function detailFiche(req, res) {
    const { id } = req.params;

    const [[session]] = await pool.query(
        `SELECT s.*, m.nom AS matiere_nom, c.nom AS classe_nom, f.nom AS filiere_nom,
            p.nom AS prof_nom, p.prenom AS prof_prenom
     FROM sessions_cours s
     JOIN matieres m ON m.id = s.matiere_id
     JOIN classes c ON c.id = s.classe_id
     JOIN filieres f ON f.id = c.filiere_id
     JOIN professeurs p ON p.id = s.professeur_id
     WHERE s.id = ?`,
        [id]
    );
    if (!session) return res.status(404).json({ erreur: "Fiche introuvable." });

    const [etudiants] = await pool.query(
        `SELECT e.nom, e.prenom, pr.statut, pr.heure_validation
     FROM presences pr
     JOIN etudiants e ON e.id = pr.etudiant_id
     WHERE pr.session_id = ?
     ORDER BY e.nom, e.prenom`,
        [id]
    );

    res.json({ session, etudiants });
}

// ============================================================
// Export PDF de la fiche.
// ============================================================

export async function exporterFichePdf(req, res) {
    const { id } = req.params;

    const [[session]] = await pool.query(
        `SELECT s.*, m.nom AS matiere_nom, c.nom AS classe_nom, f.nom AS filiere_nom,
            p.nom AS prof_nom, p.prenom AS prof_prenom
     FROM sessions_cours s
     JOIN matieres m ON m.id = s.matiere_id
     JOIN classes c ON c.id = s.classe_id
     JOIN filieres f ON f.id = c.filiere_id
     JOIN professeurs p ON p.id = s.professeur_id
     WHERE s.id = ?`,
        [id]
    );
    if (!session) return res.status(404).json({ erreur: "Fiche introuvable." });

    const [etudiants] = await pool.query(
        `SELECT e.nom, e.prenom, pr.statut
     FROM presences pr
     JOIN etudiants e ON e.id = pr.etudiant_id
     WHERE pr.session_id = ?
     ORDER BY e.nom, e.prenom`,
        [id]
    );

    const dateDebut = new Date(session.date_debut);
    const nomFichier = `fiche-presence-${session.matiere_nom}-${dateDebut.toISOString().slice(0, 10)}.pdf`
        .replace(/\s+/g, "-").toLowerCase();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nomFichier}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).text("Fiche de présence — PresenceConnect", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Filière : ${session.filiere_nom}`);
    doc.text(`Classe : ${session.classe_nom}`);
    doc.text(`Matière : ${session.matiere_nom}`);
    doc.text(`Professeur : ${session.prof_prenom} ${session.prof_nom}`);
    doc.text(`Date : ${dateDebut.toLocaleDateString("fr-FR")}`);
    doc.text(`Heure : ${dateDebut.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
    if (session.heures_effectuees) doc.text(`Heures effectuées : ${session.heures_effectuees} h`);
    doc.moveDown();

    doc.fontSize(13).text("Liste des étudiants", { underline: true });
    doc.moveDown(0.5);

    const libelles = { present: "Présent", retard: "Retard", absent: "Absent" };
    doc.fontSize(11);
    etudiants.forEach((e, i) => {
        doc.text(`${i + 1}. ${e.prenom} ${e.nom} — ${libelles[e.statut] || e.statut}`);
    });

    const total = etudiants.length;
    const presents = etudiants.filter((e) => e.statut === "present").length;
    const retards = etudiants.filter((e) => e.statut === "retard").length;
    const absents = etudiants.filter((e) => e.statut === "absent").length;

    doc.moveDown();
    doc.fontSize(11).text(`Total : ${total} — Présents : ${presents} — Retards : ${retards} — Absents : ${absents}`);

    doc.end();
}