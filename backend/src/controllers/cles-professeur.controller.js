import { pool } from "../config/db.js";
import { hashSecret, verifySecret, generateAccessKey } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";

// ============================================================
// ADMINISTRATION — génère une clé d'enrôlement pour un professeur
// ============================================================

export async function genererCleProfesseur(req, res) {
    const { dureeHeures } = req.body; // ex: 24
    const heures = Number(dureeHeures) > 0 ? Number(dureeHeures) : 24;

    const cleEnClair = generateAccessKey(); // ex: "K3F9ZP2Q"
    const cleHash = await hashSecret(cleEnClair);

    const dateExpiration = new Date(Date.now() + heures * 60 * 60 * 1000);

    const [resultat] = await pool.query(
        `INSERT INTO cles_professeur (cle_hash, genere_par_admin, date_expiration, statut)
     VALUES (?, ?, ?, 'active')`,
        [cleHash, req.utilisateur.id, dateExpiration]
    );

    // La clé en clair n'est renvoyée qu'une seule fois, ici, pour être transmise au professeur.
    // Elle n'est jamais stockée ni consultable ensuite (seul son hash existe en base).
    res.status(201).json({
        id: resultat.insertId,
        cle: cleEnClair,
        dateExpiration,
        message: "Transmettez cette clé au professeur : elle ne sera plus jamais affichée.",
    });
}

export async function listerClesProfesseur(req, res) {
    const [cles] = await pool.query(
        `SELECT cp.id, cp.date_creation, cp.date_expiration, cp.statut,
            p.nom AS professeur_nom, p.prenom AS professeur_prenom
     FROM cles_professeur cp
     LEFT JOIN professeurs p ON p.id = cp.professeur_id
     ORDER BY cp.date_creation DESC`
    );
    res.json(cles);
}

// ============================================================
// PROFESSEUR — vérifie une clé d'enrôlement (avant de remplir le formulaire)
// ============================================================

export async function verifierCleEnrolement(req, res) {
    const { cle } = req.body;
    if (!cle) return res.status(400).json({ erreur: "Clé requise." });

    const cleValide = await trouverCleActiveEtValide(cle);
    if (!cleValide) {
        return res.status(401).json({ erreur: "Clé invalide ou expirée. Demandez une nouvelle clé à l'administration." });
    }
    res.json({ message: "Clé valide. Vous pouvez compléter votre profil." });
}

// ============================================================
// PROFESSEUR — active son compte avec la clé + ses informations
// ============================================================

export async function activerCompteProfesseur(req, res) {
    const { cle, nom, prenom, filiereId, licence, nombreHeures, nouvelleCleAcces } = req.body;

    if (!cle || !nom || !prenom || !filiereId || !nouvelleCleAcces) {
        return res.status(400).json({ erreur: "Merci de renseigner tous les champs obligatoires." });
    }

    const connection = await pool.getConnection();
    try {
        const ligneCle = await trouverCleActiveEtValide(cle, connection);
        if (!ligneCle) {
            return res.status(401).json({ erreur: "Clé invalide ou expirée. Demandez une nouvelle clé à l'administration." });
        }

        const cleAccesHash = await hashSecret(nouvelleCleAcces);

        await connection.beginTransaction();

        const [utilisateur] = await connection.query(
            "INSERT INTO utilisateurs (role) VALUES ('professeur')"
        );
        const professeurId = utilisateur.insertId;

        await connection.query(
            `INSERT INTO professeurs (id, nom, prenom, filiere_id, licence, nombre_heures, cle_acces_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [professeurId, nom, prenom, filiereId, licence || null, nombreHeures || 0, cleAccesHash]
        );

        await connection.query(
            "UPDATE cles_professeur SET professeur_id = ?, statut = 'utilisee' WHERE id = ?",
            [professeurId, ligneCle.id]
        );

        await connection.commit();

        const token = signToken({ id: professeurId, role: "professeur" });

        res.status(201).json({
            message: "Compte professeur créé.",
            token,
            utilisateur: { id: professeurId, nom, prenom, role: "professeur" },
        });
    } catch (erreur) {
        await connection.rollback();
        console.error(erreur);
        res.status(500).json({ erreur: "Une erreur est survenue lors de l'activation du compte." });
    } finally {
        connection.release();
    }
}

// ============================================================
// Fonction utilitaire : retrouve une clé active et non expirée
// correspondant à la valeur fournie (les clés sont hachées, donc
// on doit comparer avec bcrypt une par une parmi les clés actives).
// ============================================================

async function trouverCleActiveEtValide(cleEnClair, connexionExistante) {
    const executeur = connexionExistante || pool;

    const [clesActives] = await executeur.query(
        "SELECT * FROM cles_professeur WHERE statut = 'active' AND date_expiration > NOW()"
    );

    for (const ligne of clesActives) {
        const correspond = await verifySecret(cleEnClair, ligne.cle_hash);
        if (correspond) return ligne;
    }

    // Marquer comme expirées les clés dont la date est dépassée (nettoyage discret).
    await executeur.query(
        "UPDATE cles_professeur SET statut = 'expiree' WHERE statut = 'active' AND date_expiration <= NOW()"
    );

    return null;
}