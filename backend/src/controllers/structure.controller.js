import { pool } from "../config/db.js";

// ============================================================
// FILIÈRES
// ============================================================

export async function listerFilieres(req, res) {
    const [filieres] = await pool.query("SELECT * FROM filieres ORDER BY nom");
    res.json(filieres);
}

export async function creerFiliere(req, res) {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ erreur: "Le nom de la filière est requis." });

    const [resultat] = await pool.query("INSERT INTO filieres (nom) VALUES (?)", [nom]);
    res.status(201).json({ id: resultat.insertId, nom });
}

export async function modifierFiliere(req, res) {
    const { id } = req.params;
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ erreur: "Le nom de la filière est requis." });

    await pool.query("UPDATE filieres SET nom = ? WHERE id = ?", [nom, id]);
    res.json({ message: "Filière mise à jour." });
}

export async function supprimerFiliere(req, res) {
    const { id } = req.params;
    await pool.query("DELETE FROM filieres WHERE id = ?", [id]);
    res.json({ message: "Filière supprimée." });
}

// ============================================================
// CLASSES
// ============================================================

export async function listerClasses(req, res) {
    const { filiereId } = req.query;

    let requete = `
    SELECT c.*, f.nom AS filiere_nom
    FROM classes c
    JOIN filieres f ON f.id = c.filiere_id
  `;
    const parametres = [];

    if (filiereId) {
        requete += " WHERE c.filiere_id = ?";
        parametres.push(filiereId);
    }
    requete += " ORDER BY f.nom, c.nom";

    const [classes] = await pool.query(requete, parametres);
    res.json(classes);
}

export async function creerClasse(req, res) {
    const { nom, filiereId, annee } = req.body;
    if (!nom || !filiereId || !annee) {
        return res.status(400).json({ erreur: "Nom, filière et année sont requis." });
    }

    const [resultat] = await pool.query(
        "INSERT INTO classes (nom, filiere_id, annee) VALUES (?, ?, ?)",
        [nom, filiereId, annee]
    );
    res.status(201).json({ id: resultat.insertId, nom, filiereId, annee });
}

export async function modifierClasse(req, res) {
    const { id } = req.params;
    const { nom, filiereId, annee } = req.body;
    if (!nom || !filiereId || !annee) {
        return res.status(400).json({ erreur: "Nom, filière et année sont requis." });
    }

    await pool.query(
        "UPDATE classes SET nom = ?, filiere_id = ?, annee = ? WHERE id = ?",
        [nom, filiereId, annee, id]
    );
    res.json({ message: "Classe mise à jour." });
}

export async function supprimerClasse(req, res) {
    const { id } = req.params;
    await pool.query("DELETE FROM classes WHERE id = ?", [id]);
    res.json({ message: "Classe supprimée." });
}

// ============================================================
// MATIÈRES
// ============================================================

export async function listerMatieres(req, res) {
    const { filiereId } = req.query;

    let requete = `
    SELECT m.*, f.nom AS filiere_nom
    FROM matieres m
    JOIN filieres f ON f.id = m.filiere_id
  `;
    const parametres = [];

    if (filiereId) {
        requete += " WHERE m.filiere_id = ?";
        parametres.push(filiereId);
    }
    requete += " ORDER BY f.nom, m.nom";

    const [matieres] = await pool.query(requete, parametres);
    res.json(matieres);
}

export async function creerMatiere(req, res) {
    const { nom, filiereId } = req.body;
    if (!nom || !filiereId) {
        return res.status(400).json({ erreur: "Nom et filière sont requis." });
    }

    const [resultat] = await pool.query(
        "INSERT INTO matieres (nom, filiere_id) VALUES (?, ?)",
        [nom, filiereId]
    );
    res.status(201).json({ id: resultat.insertId, nom, filiereId });
}

export async function modifierMatiere(req, res) {
    const { id } = req.params;
    const { nom, filiereId } = req.body;
    if (!nom || !filiereId) {
        return res.status(400).json({ erreur: "Nom et filière sont requis." });
    }

    await pool.query("UPDATE matieres SET nom = ?, filiere_id = ? WHERE id = ?", [nom, filiereId, id]);
    res.json({ message: "Matière mise à jour." });
}

export async function supprimerMatiere(req, res) {
    const { id } = req.params;
    await pool.query("DELETE FROM matieres WHERE id = ?", [id]);
    res.json({ message: "Matière supprimée." });
}