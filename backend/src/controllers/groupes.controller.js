import { pool } from "../config/db.js";

const DESCRIPTION_MAX_CARACTERES = 150;

// ============================================================
// Liste de tous les groupes — seulement nom, description et photo
// (le nombre de membres reste interne, visible seulement une fois membre).
// ============================================================

export async function listerGroupes(req, res) {
    const [groupes] = await pool.query(
        `SELECT g.id, g.nom, g.description, g.photo_groupe, g.createur_id,
            EXISTS(
              SELECT 1 FROM groupes_membres gm WHERE gm.groupe_id = g.id AND gm.etudiant_id = ?
            ) AS estMembre,
            EXISTS(
              SELECT 1 FROM groupes_demandes_adhesion gd
              WHERE gd.groupe_id = g.id AND gd.etudiant_id = ? AND gd.statut = 'en_attente'
            ) AS demandeEnAttente
     FROM groupes g
     ORDER BY g.created_at DESC`,
        [req.utilisateur.id, req.utilisateur.id]
    );
    res.json(groupes.map((g) => ({
        ...g,
        estMembre: !!g.estMembre,
        demandeEnAttente: !!g.demandeEnAttente,
    })));
}

export async function creerGroupe(req, res) {
    const { nom, description } = req.body;
    if (!nom || !nom.trim()) {
        return res.status(400).json({ erreur: "Le nom du groupe est requis." });
    }
    if (description && description.length > DESCRIPTION_MAX_CARACTERES) {
        return res.status(400).json({ erreur: `La description ne peut pas dépasser ${DESCRIPTION_MAX_CARACTERES} caractères.` });
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [resultat] = await connection.query(
            "INSERT INTO groupes (nom, description, photo_groupe, createur_id) VALUES (?, ?, ?, ?)",
            [nom, description || null, photo, req.utilisateur.id]
        );
        await connection.query(
            "INSERT INTO groupes_membres (groupe_id, etudiant_id) VALUES (?, ?)",
            [resultat.insertId, req.utilisateur.id]
        );
        await connection.commit();
        res.status(201).json({ id: resultat.insertId, message: "Groupe créé." });
    } catch (erreur) {
        await connection.rollback();
        console.error(erreur);
        res.status(500).json({ erreur: "Impossible de créer le groupe." });
    } finally {
        connection.release();
    }
}

// ============================================================
// Demande d'adhésion — doit être approuvée par le créateur du groupe.
// ============================================================

export async function demanderAdhesion(req, res) {
    const { id } = req.params;

    const [[groupe]] = await pool.query("SELECT * FROM groupes WHERE id = ?", [id]);
    if (!groupe) return res.status(404).json({ erreur: "Groupe introuvable." });

    const [[dejaMembre]] = await pool.query(
        "SELECT 1 FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, req.utilisateur.id]
    );
    if (dejaMembre) return res.status(409).json({ erreur: "Vous êtes déjà membre de ce groupe." });

    await pool.query(
        `INSERT INTO groupes_demandes_adhesion (groupe_id, etudiant_id, statut)
     VALUES (?, ?, 'en_attente')
     ON DUPLICATE KEY UPDATE statut = 'en_attente'`,
        [id, req.utilisateur.id]
    );

    await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
     VALUES (?, 'demande_adhesion_groupe', ?, ?)`,
        [groupe.createur_id, "Une demande pour rejoindre votre groupe attend votre validation.", id]
    );

    res.status(201).json({ message: "Demande envoyée, en attente de validation par le créateur." });
}

// Le créateur consulte les demandes en attente pour son groupe.
export async function listerDemandesAdhesion(req, res) {
    const { id } = req.params;
    const [[groupe]] = await pool.query("SELECT createur_id FROM groupes WHERE id = ?", [id]);
    if (!groupe || groupe.createur_id !== req.utilisateur.id) {
        return res.status(403).json({ erreur: "Seul le créateur du groupe peut voir les demandes." });
    }

    const [demandes] = await pool.query(
        `SELECT gd.id, e.id AS etudiant_id, e.nom, e.prenom
     FROM groupes_demandes_adhesion gd
     JOIN etudiants e ON e.id = gd.etudiant_id
     WHERE gd.groupe_id = ? AND gd.statut = 'en_attente'
     ORDER BY gd.created_at`,
        [id]
    );
    res.json(demandes);
}

export async function traiterDemandeAdhesion(req, res) {
    const { id, demandeId } = req.params;
    const { decision } = req.body; // "acceptee" ou "refusee"

    const [[groupe]] = await pool.query("SELECT createur_id FROM groupes WHERE id = ?", [id]);
    if (!groupe || groupe.createur_id !== req.utilisateur.id) {
        return res.status(403).json({ erreur: "Seul le créateur du groupe peut valider les demandes." });
    }
    if (!["acceptee", "refusee"].includes(decision)) {
        return res.status(400).json({ erreur: "Décision invalide." });
    }

    const [[demande]] = await pool.query(
        "SELECT * FROM groupes_demandes_adhesion WHERE id = ? AND groupe_id = ?",
        [demandeId, id]
    );
    if (!demande) return res.status(404).json({ erreur: "Demande introuvable." });

    await pool.query("UPDATE groupes_demandes_adhesion SET statut = ? WHERE id = ?", [decision, demandeId]);

    if (decision === "acceptee") {
        await pool.query(
            "INSERT IGNORE INTO groupes_membres (groupe_id, etudiant_id) VALUES (?, ?)",
            [id, demande.etudiant_id]
        );
    }

    await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
     VALUES (?, 'demande_adhesion_traitee', ?, ?)`,
        [
            demande.etudiant_id,
            decision === "acceptee" ? "Votre demande pour rejoindre le groupe a été acceptée." : "Votre demande pour rejoindre le groupe a été refusée.",
            id,
        ]
    );

    res.json({ message: "Demande traitée." });
}

// ============================================================
// Détail d'un groupe (réservé aux membres) : description, photo, membres
// ============================================================

export async function detailGroupe(req, res) {
    const { id } = req.params;

    const [[estMembre]] = await pool.query(
        "SELECT 1 FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, req.utilisateur.id]
    );
    if (!estMembre) {
        return res.status(403).json({ erreur: "Vous devez rejoindre ce groupe pour voir son contenu." });
    }

    const [[groupe]] = await pool.query("SELECT * FROM groupes WHERE id = ?", [id]);
    if (!groupe) return res.status(404).json({ erreur: "Groupe introuvable." });

    const [membres] = await pool.query(
        `SELECT e.id, e.nom, e.prenom FROM groupes_membres gm
     JOIN etudiants e ON e.id = gm.etudiant_id
     WHERE gm.groupe_id = ?
     ORDER BY e.nom`,
        [id]
    );

    res.json({
        groupe,
        membres,
        estCreateur: groupe.createur_id === req.utilisateur.id,
    });
}

// ============================================================
// Recherche d'étudiants à inviter — indique si déjà membre ou déjà invité
// ============================================================

export async function rechercherEtudiants(req, res) {
    const { recherche, groupeId } = req.query;
    if (!recherche || recherche.trim().length < 2) return res.json([]);

    const motif = `%${recherche}%`;
    const [etudiants] = await pool.query(
        `SELECT id, nom, prenom FROM etudiants
     WHERE (nom LIKE ? OR prenom LIKE ?) AND id != ?
     LIMIT 10`,
        [motif, motif, req.utilisateur.id]
    );

    if (!groupeId || etudiants.length === 0) {
        return res.json(etudiants.map((e) => ({ ...e, dejaMembre: false, dejaInvite: false })));
    }

    const ids = etudiants.map((e) => e.id);
    const [membres] = await pool.query(
        `SELECT etudiant_id FROM groupes_membres WHERE groupe_id = ? AND etudiant_id IN (?)`,
        [groupeId, ids]
    );
    const [invitations] = await pool.query(
        `SELECT etudiant_invite FROM groupes_invitations
     WHERE groupe_id = ? AND statut = 'en_attente' AND etudiant_invite IN (?)`,
        [groupeId, ids]
    );
    const idsMembres = new Set(membres.map((m) => m.etudiant_id));
    const idsInvites = new Set(invitations.map((i) => i.etudiant_invite));

    res.json(etudiants.map((e) => ({
        ...e,
        dejaMembre: idsMembres.has(e.id),
        dejaInvite: idsInvites.has(e.id),
    })));
}

// ============================================================
// Invitations : envoyer, lister les miennes, répondre
// ============================================================

export async function inviterDansGroupe(req, res) {
    const { id } = req.params;
    const { etudiantId } = req.body;

    const [[estMembre]] = await pool.query(
        "SELECT 1 FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, req.utilisateur.id]
    );
    if (!estMembre) {
        return res.status(403).json({ erreur: "Seuls les membres peuvent inviter." });
    }

    const [[dejaMembre]] = await pool.query(
        "SELECT 1 FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, etudiantId]
    );
    if (dejaMembre) {
        return res.status(409).json({ erreur: "Cet étudiant est déjà membre du groupe." });
    }

    const [[dejaInvite]] = await pool.query(
        "SELECT 1 FROM groupes_invitations WHERE groupe_id = ? AND etudiant_invite = ? AND statut = 'en_attente'",
        [id, etudiantId]
    );
    if (dejaInvite) {
        return res.status(409).json({ erreur: "Cet étudiant a déjà été invité." });
    }

    await pool.query(
        `INSERT INTO groupes_invitations (groupe_id, invite_par, etudiant_invite, statut)
     VALUES (?, ?, ?, 'en_attente')`,
        [id, req.utilisateur.id, etudiantId]
    );

    await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
     VALUES (?, 'invitation_groupe', ?, ?)`,
        [etudiantId, "Vous avez reçu une invitation à rejoindre un groupe.", id]
    );

    res.status(201).json({ message: "Invitation envoyée." });
}

export async function mesInvitations(req, res) {
    const [invitations] = await pool.query(
        `SELECT gi.id, gi.statut, g.id AS groupe_id, g.nom AS groupe_nom,
            e.nom AS invite_par_nom, e.prenom AS invite_par_prenom
     FROM groupes_invitations gi
     JOIN groupes g ON g.id = gi.groupe_id
     JOIN etudiants e ON e.id = gi.invite_par
     WHERE gi.etudiant_invite = ? AND gi.statut = 'en_attente'
     ORDER BY gi.created_at DESC`,
        [req.utilisateur.id]
    );
    res.json(invitations);
}

export async function repondreInvitation(req, res) {
    const { id } = req.params;
    const { reponse } = req.body;

    if (!["acceptee", "refusee"].includes(reponse)) {
        return res.status(400).json({ erreur: "Réponse invalide." });
    }

    const [[invitation]] = await pool.query(
        "SELECT * FROM groupes_invitations WHERE id = ? AND etudiant_invite = ?",
        [id, req.utilisateur.id]
    );
    if (!invitation) return res.status(404).json({ erreur: "Invitation introuvable." });

    await pool.query("UPDATE groupes_invitations SET statut = ? WHERE id = ?", [reponse, id]);

    if (reponse === "acceptee") {
        await pool.query(
            "INSERT IGNORE INTO groupes_membres (groupe_id, etudiant_id) VALUES (?, ?)",
            [invitation.groupe_id, req.utilisateur.id]
        );
    }

    res.json({ message: reponse === "acceptee" ? "Invitation acceptée." : "Invitation refusée." });
}

// ============================================================
// Messagerie du groupe — écrire et répondre à un message précis
// ============================================================

export async function listerMessages(req, res) {
    const { id } = req.params;

    const [[estMembre]] = await pool.query(
        "SELECT 1 FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, req.utilisateur.id]
    );
    if (!estMembre) return res.status(403).json({ erreur: "Réservé aux membres du groupe." });

    const [messages] = await pool.query(
        `SELECT gm.id, gm.contenu, gm.type_contenu, gm.fichier, gm.created_at, gm.reponse_a,
            e.id AS auteur_id, e.nom AS auteur_nom, e.prenom AS auteur_prenom, e.photo_profil AS auteur_photo,
            rep.contenu AS reponse_contenu, rep.type_contenu AS reponse_type_contenu,
            ea.prenom AS reponse_auteur_prenom, ea.nom AS reponse_auteur_nom
     FROM groupes_messages gm
     JOIN etudiants e ON e.id = gm.auteur_id
     LEFT JOIN groupes_messages rep ON rep.id = gm.reponse_a
     LEFT JOIN etudiants ea ON ea.id = rep.auteur_id
     WHERE gm.groupe_id = ?
     ORDER BY gm.created_at ASC`,
        [id]
    );
    res.json(messages);
}

export async function envoyerMessage(req, res) {
    const { id } = req.params;
    const { contenu, reponseA, typeContenu } = req.body;
    const type = typeContenu || "texte";

    const fichier = req.file ? `/uploads/${req.file.filename}` : null;

    if (type === "texte" && (!contenu || !contenu.trim())) {
        return res.status(400).json({ erreur: "Le message ne peut pas être vide." });
    }
    if (type !== "texte" && !fichier) {
        return res.status(400).json({ erreur: "Un fichier est requis pour ce type de message." });
    }

    const [[estMembre]] = await pool.query(
        "SELECT 1 FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, req.utilisateur.id]
    );
    if (!estMembre) return res.status(403).json({ erreur: "Réservé aux membres du groupe." });

    const [resultat] = await pool.query(
        "INSERT INTO groupes_messages (groupe_id, auteur_id, contenu, type_contenu, fichier, reponse_a) VALUES (?, ?, ?, ?, ?, ?)",
        [id, req.utilisateur.id, contenu || null, type, fichier, reponseA || null]
    );

    res.status(201).json({ id: resultat.insertId, message: "Message envoyé." });
}

// ============================================================
// Quitter un groupe
// ============================================================

export async function quitterGroupe(req, res) {
    const { id } = req.params;
    await pool.query(
        "DELETE FROM groupes_membres WHERE groupe_id = ? AND etudiant_id = ?",
        [id, req.utilisateur.id]
    );
    res.json({ message: "Vous avez quitté le groupe." });
}