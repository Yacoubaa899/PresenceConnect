import { pool } from "../config/db.js";

const CATEGORIES_VALIDES = ["info", "planning", "bibliotheque"];
const TYPES_VALIDES = ["pdf", "image", "texte"];

// ============================================================
// LECTURE — publications actives d'une catégorie (tous rôles connectés)
// ============================================================

export async function listerPublications(req, res) {
    const { categorie } = req.params;
    if (!CATEGORIES_VALIDES.includes(categorie)) {
        return res.status(400).json({ erreur: "Catégorie inconnue." });
    }

    // On ne renvoie que les publications déjà publiées et non expirées.
    const [publications] = await pool.query(
        `SELECT p.*, a.nom AS admin_nom, a.prenom AS admin_prenom,
            pr.nom AS prof_nom, pr.prenom AS prof_prenom
     FROM publications p
     LEFT JOIN administrateurs a ON a.id = p.auteur_admin_id
     LEFT JOIN professeurs pr ON pr.id = p.auteur_professeur_id
     WHERE p.categorie = ?
       AND p.date_publication IS NOT NULL
       AND (p.date_expiration IS NULL OR p.date_expiration > NOW())
     ORDER BY p.date_publication DESC`,
        [categorie]
    );
    res.json(publications);
}

// ============================================================
// CRÉATION — par l'administration (info, planning, bibliothèque)
// ============================================================

export async function creerPublicationAdmin(req, res) {
    const { categorie, typeContenu, texte, estProgrammee, dateProgrammee, dureeExpiration } = req.body;

    if (!CATEGORIES_VALIDES.includes(categorie) || !TYPES_VALIDES.includes(typeContenu)) {
        return res.status(400).json({ erreur: "Catégorie ou type de contenu invalide." });
    }

    const fichier = req.file ? `/uploads/${req.file.filename}` : null;
    if (typeContenu !== "texte" && !fichier) {
        return res.status(400).json({ erreur: "Un fichier est requis pour ce type de contenu." });
    }

    const programmee = estProgrammee === true || estProgrammee === "true";
    const dateExpiration = calculerDateExpiration(dureeExpiration, programmee ? dateProgrammee : new Date());
    const publieMaintenant = !programmee;

    const [resultat] = await pool.query(
        `INSERT INTO publications
      (categorie, type_contenu, fichier, texte, auteur_admin_id, date_publication, est_programmee, date_programmee, date_expiration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            categorie, typeContenu, fichier || null, texte || null, req.utilisateur.id,
            publieMaintenant ? new Date() : null,
            programmee,
            programmee ? dateProgrammee : null,
            dateExpiration,
        ]
    );

    res.status(201).json({ id: resultat.insertId, message: publieMaintenant ? "Publication publiée." : "Publication programmée." });
}

// ============================================================
// LECTURE — publications en attente de publication (programmées,
// pas encore diffusées), pour pouvoir les modifier avant l'heure dite.
// ============================================================

export async function listerPublicationsProgrammees(req, res) {
    const { categorie } = req.params;
    if (!CATEGORIES_VALIDES.includes(categorie)) {
        return res.status(400).json({ erreur: "Catégorie inconnue." });
    }

    let requete = `
    SELECT * FROM publications
    WHERE categorie = ? AND date_publication IS NULL AND est_programmee = TRUE
  `;
    const parametres = [categorie];

    if (req.utilisateur.role === "professeur") {
        requete += " AND auteur_professeur_id = ?";
        parametres.push(req.utilisateur.id);
    }
    requete += " ORDER BY date_programmee ASC";

    const [publications] = await pool.query(requete, parametres);
    res.json(publications);
}

// ============================================================
// MODIFICATION — d'une publication programmée, tant qu'elle n'est
// pas encore publiée (texte, fichier, date programmée, expiration).
// ============================================================

export async function modifierPublicationProgrammee(req, res) {
    const { id } = req.params;
    const { texte, dateProgrammee, dureeExpiration } = req.body;

    const [[publication]] = await pool.query("SELECT * FROM publications WHERE id = ?", [id]);
    if (!publication) return res.status(404).json({ erreur: "Publication introuvable." });

    const estAuteurAdmin = req.utilisateur.role === "administration" && publication.auteur_admin_id;
    const estAuteurProf = req.utilisateur.role === "professeur" && publication.auteur_professeur_id === req.utilisateur.id;
    if (!estAuteurAdmin && !estAuteurProf) {
        return res.status(403).json({ erreur: "Vous ne pouvez pas modifier cette publication." });
    }
    if (publication.date_publication !== null) {
        return res.status(409).json({ erreur: "Cette publication est déjà en ligne, elle ne peut plus être modifiée ici." });
    }

    const nouvelleDateProgrammee = dateProgrammee || publication.date_programmee;
    const fichier = req.file ? `/uploads/${req.file.filename}` : publication.fichier;
    const dateExpiration = dureeExpiration
        ? calculerDateExpiration(dureeExpiration, nouvelleDateProgrammee)
        : publication.date_expiration;

    await pool.query(
        "UPDATE publications SET texte = ?, fichier = ?, date_programmee = ?, date_expiration = ? WHERE id = ?",
        [texte ?? publication.texte, fichier, nouvelleDateProgrammee, dateExpiration, id]
    );

    res.json({ message: "Publication programmée mise à jour." });
}

// ============================================================
// CRÉATION — par un professeur (bibliothèque uniquement, pour ses cours)
// ============================================================

export async function creerPublicationProfesseur(req, res) {
    const { typeContenu, texte, matiereId, dureeExpiration } = req.body;

    if (!TYPES_VALIDES.includes(typeContenu)) {
        return res.status(400).json({ erreur: "Type de contenu invalide." });
    }

    const fichier = req.file ? `/uploads/${req.file.filename}` : null;
    if (typeContenu !== "texte" && !fichier) {
        return res.status(400).json({ erreur: "Un fichier est requis pour ce type de contenu." });
    }
    if (!matiereId) {
        return res.status(400).json({ erreur: "La matière concernée est requise." });
    }

    // Vérifie que ce prof dispense bien cette matière.
    const [[autorise]] = await pool.query(
        "SELECT 1 FROM professeurs_matieres WHERE professeur_id = ? AND matiere_id = ?",
        [req.utilisateur.id, matiereId]
    );
    if (!autorise) {
        return res.status(403).json({ erreur: "Vous ne dispensez pas cette matière." });
    }

    const dateExpiration = calculerDateExpiration(dureeExpiration);

    const [resultat] = await pool.query(
        `INSERT INTO publications
      (categorie, type_contenu, fichier, texte, auteur_professeur_id, matiere_id, date_publication, est_programmee, date_expiration)
     VALUES ('bibliotheque', ?, ?, ?, ?, ?, ?, FALSE, ?)`,
        [typeContenu, fichier || null, texte || null, req.utilisateur.id, matiereId, new Date(), dateExpiration]
    );

    // Prévenir l'administration qu'un prof a publié dans la bibliothèque.
    const [[prof]] = await pool.query("SELECT nom, prenom FROM professeurs WHERE id = ?", [req.utilisateur.id]);
    const [[matiere]] = await pool.query("SELECT nom FROM matieres WHERE id = ?", [matiereId]);
    const [admins] = await pool.query("SELECT id FROM administrateurs");
    for (const admin of admins) {
        await pool.query(
            `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
       VALUES (?, 'publication_bibliotheque', ?, ?)`,
            [
                admin.id,
                `${prof.prenom} ${prof.nom} a publié un cours en bibliothèque (${matiere?.nom || "matière"}).`,
                resultat.insertId,
            ]
        );
    }

    res.status(201).json({ id: resultat.insertId, message: "Cours publié dans la bibliothèque." });
}

// ============================================================
// SUPPRESSION (admin, ou prof pour ses propres publications)
// ============================================================

export async function supprimerPublication(req, res) {
    const { id } = req.params;

    const [[publication]] = await pool.query("SELECT * FROM publications WHERE id = ?", [id]);
    if (!publication) return res.status(404).json({ erreur: "Publication introuvable." });

    const estAuteurAdmin = req.utilisateur.role === "administration" && publication.auteur_admin_id;
    const estAuteurProf = req.utilisateur.role === "professeur" && publication.auteur_professeur_id === req.utilisateur.id;

    if (!estAuteurAdmin && !estAuteurProf) {
        return res.status(403).json({ erreur: "Vous ne pouvez pas supprimer cette publication." });
    }

    await pool.query("DELETE FROM publications WHERE id = ?", [id]);
    res.json({ message: "Publication supprimée." });
}

// ============================================================
// Utilitaire : convertit une durée choisie en date d'expiration
// ============================================================

function calculerDateExpiration(duree, dateBase = new Date()) {
    if (!duree || duree === "illimitee") return null;

    const base = new Date(dateBase).getTime();
    const millisecondesParDuree = {
        "1_jour": 1 * 24 * 60 * 60 * 1000,
        "2_jours": 2 * 24 * 60 * 60 * 1000,
        "7_jours": 7 * 24 * 60 * 60 * 1000,
        "1_mois": 30 * 24 * 60 * 60 * 1000,
    };

    const delai = millisecondesParDuree[duree];
    return delai ? new Date(base + delai) : null;
}