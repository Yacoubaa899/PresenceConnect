import { pool } from "../config/db.js";
import { verifySecret } from "../utils/hash.js";

// ============================================================
// PROFESSEUR — ses propres matières et classes disponibles
// ============================================================

export async function mesMatieres(req, res) {
    const [matieres] = await pool.query(
        `SELECT m.id, m.nom FROM professeurs_matieres pm
     JOIN matieres m ON m.id = pm.matiere_id
     WHERE pm.professeur_id = ?`,
        [req.utilisateur.id]
    );
    res.json(matieres);
}

// Retrouve la session actuellement ouverte par ce prof, s'il y en a une
// (permet de reprendre après un rechargement de page).
export async function maSessionOuverte(req, res) {
    const [[session]] = await pool.query(
        "SELECT id FROM sessions_cours WHERE professeur_id = ? AND statut = 'ouverte' ORDER BY date_debut DESC LIMIT 1",
        [req.utilisateur.id]
    );
    res.json(session || null);
}

// ============================================================
// PROFESSEUR — démarrer une session de cours
// ============================================================

export async function demarrerSession(req, res) {
    const { matiereId, classeId } = req.body;
    if (!matiereId || !classeId) {
        return res.status(400).json({ erreur: "Matière et classe sont requises." });
    }

    // Vérifie que ce prof dispense bien cette matière (sécurité).
    const [[autorise]] = await pool.query(
        "SELECT 1 FROM professeurs_matieres WHERE professeur_id = ? AND matiere_id = ?",
        [req.utilisateur.id, matiereId]
    );
    if (!autorise) {
        return res.status(403).json({ erreur: "Vous ne dispensez pas cette matière." });
    }

    const [resultat] = await pool.query(
        `INSERT INTO sessions_cours (matiere_id, professeur_id, classe_id, date_debut, statut)
     VALUES (?, ?, ?, NOW(), 'ouverte')`,
        [matiereId, req.utilisateur.id, classeId]
    );

    res.status(201).json({ id: resultat.insertId, message: "Session de cours démarrée." });
}

// ============================================================
// PROFESSEUR — voir en direct la liste de la classe et les présences
// ============================================================

export async function detailSession(req, res) {
    const { id } = req.params;

    const [[session]] = await pool.query("SELECT * FROM sessions_cours WHERE id = ?", [id]);
    if (!session) return res.status(404).json({ erreur: "Session introuvable." });
    if (session.professeur_id !== req.utilisateur.id) {
        return res.status(403).json({ erreur: "Cette session ne vous appartient pas." });
    }

    const [etudiants] = await pool.query(
        `SELECT e.id, e.nom, e.prenom, pr.statut, pr.methode, pr.heure_validation
     FROM etudiants e
     LEFT JOIN presences pr ON pr.etudiant_id = e.id AND pr.session_id = ?
     WHERE e.classe_id = ?
     ORDER BY e.nom, e.prenom`,
        [id, session.classe_id]
    );

    res.json({ session, etudiants });
}

// ============================================================
// ÉTUDIANT — sait si une session est actuellement ouverte pour sa classe
// (affiche la bannière "présence en cours" sur son accueil)
// ============================================================

export async function sessionOuvertePourEtudiant(req, res) {
    const [[etudiant]] = await pool.query("SELECT classe_id FROM etudiants WHERE id = ?", [req.utilisateur.id]);

    const [[session]] = await pool.query(
        `SELECT s.id, s.date_debut, m.nom AS matiere_nom
     FROM sessions_cours s
     JOIN matieres m ON m.id = s.matiere_id
     WHERE s.classe_id = ? AND s.statut = 'ouverte'
     ORDER BY s.date_debut DESC LIMIT 1`,
        [etudiant.classe_id]
    );

    res.json(session || null);
}

// ============================================================
// Validation d'une présence — commune aux deux méthodes ci-dessous.
// Calcule automatiquement "présent" ou "retard" selon le délai
// toléré défini par l'administration.
// ============================================================

async function enregistrerPresence(sessionId, etudiantId, methode, statutForce) {
    const [[session]] = await pool.query("SELECT * FROM sessions_cours WHERE id = ?", [sessionId]);
    if (!session || session.statut !== "ouverte") {
        throw { code: 409, erreur: "Cette session n'est pas (ou plus) ouverte." };
    }

    let statut = statutForce;
    if (!statut) {
        const [[parametres]] = await pool.query("SELECT delai_retard_minutes FROM parametres_admin WHERE id = 1");
        const minutesEcoulees = (Date.now() - new Date(session.date_debut).getTime()) / 60000;
        statut = minutesEcoulees > parametres.delai_retard_minutes ? "retard" : "present";
    }

    await pool.query(
        `INSERT INTO presences (session_id, etudiant_id, statut, methode)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE statut = VALUES(statut), methode = VALUES(methode), heure_validation = NOW()`,
        [sessionId, etudiantId, statut, methode]
    );

    return statut;
}

// ============================================================
// PROFESSEUR — valide la présence d'un étudiant qui a saisi son mot
// de passe sur l'appareil du prof (carte/téléphone oublié) : le prof
// confirme visuellement que c'est bien lui en déclenchant cette action.
// ============================================================

export async function validerPresenceParMotDePasse(req, res) {
    const { id: sessionId } = req.params;
    const { etudiantId, motDePasse } = req.body;

    const [[etudiant]] = await pool.query("SELECT mot_de_passe_hash FROM etudiants WHERE id = ?", [etudiantId]);
    if (!etudiant) return res.status(404).json({ erreur: "Étudiant introuvable." });

    const motDePasseValide = await verifySecret(motDePasse, etudiant.mot_de_passe_hash);
    if (!motDePasseValide) {
        return res.status(401).json({ erreur: "Mot de passe incorrect." });
    }

    try {
        const statut = await enregistrerPresence(sessionId, etudiantId, "mot_de_passe_confirme_prof");
        res.json({ message: "Présence validée.", statut });
    } catch (e) {
        res.status(e.code || 500).json({ erreur: e.erreur || "Erreur serveur." });
    }
}

// ============================================================
// PROFESSEUR — marque manuellement un étudiant présent / retard / absent
// (oubli de carte, correction, etc.)
// ============================================================

export async function marquerPresenceManuelle(req, res) {
    const { id: sessionId } = req.params;
    const { etudiantId, statut } = req.body;

    if (!["present", "retard", "absent"].includes(statut)) {
        return res.status(400).json({ erreur: "Statut invalide." });
    }

    try {
        await enregistrerPresence(sessionId, etudiantId, "manuel_prof", statut);
        res.json({ message: "Présence mise à jour.", statut });
    } catch (e) {
        res.status(e.code || 500).json({ erreur: e.erreur || "Erreur serveur." });
    }
}

// ============================================================
// PROFESSEUR — clôture la session : les étudiants non marqués
// deviennent "absent", les heures effectuées sont calculées.
// ============================================================

export async function cloturerSession(req, res) {
    const { id } = req.params;

    const [[session]] = await pool.query("SELECT * FROM sessions_cours WHERE id = ?", [id]);
    if (!session) return res.status(404).json({ erreur: "Session introuvable." });
    if (session.professeur_id !== req.utilisateur.id) {
        return res.status(403).json({ erreur: "Cette session ne vous appartient pas." });
    }

    // Tout étudiant de la classe sans ligne de présence devient "absent".
    await pool.query(
        `INSERT INTO presences (session_id, etudiant_id, statut, methode)
     SELECT ?, e.id, 'absent', 'manuel_prof'
     FROM etudiants e
     WHERE e.classe_id = ?
       AND e.id NOT IN (SELECT etudiant_id FROM presences WHERE session_id = ?)`,
        [id, session.classe_id, id]
    );

    const heuresEffectuees = (Date.now() - new Date(session.date_debut).getTime()) / 3600000;

    await pool.query(
        "UPDATE sessions_cours SET statut = 'cloturee', date_fin = NOW(), heures_effectuees = ? WHERE id = ?",
        [heuresEffectuees.toFixed(2), id]
    );

    const [recap] = await pool.query(
        `SELECT statut, COUNT(*) AS total FROM presences WHERE session_id = ? GROUP BY statut`,
        [id]
    );

    res.json({ message: "Session clôturée.", recapitulatif: recap });
}

// ============================================================
// PROFESSEUR — envoie la fiche de présence finale à l'administration
// ============================================================

export async function envoyerFichePresence(req, res) {
    const { id } = req.params;

    const [[session]] = await pool.query(
        `SELECT s.*, m.nom AS matiere_nom, p.nom AS prof_nom, p.prenom AS prof_prenom
     FROM sessions_cours s
     JOIN matieres m ON m.id = s.matiere_id
     JOIN professeurs p ON p.id = s.professeur_id
     WHERE s.id = ?`,
        [id]
    );
    if (!session || session.professeur_id !== req.utilisateur.id) {
        return res.status(403).json({ erreur: "Cette session ne vous appartient pas." });
    }
    if (session.statut !== "cloturee") {
        return res.status(409).json({ erreur: "Clôturez la session avant de l'envoyer." });
    }

    const [recap] = await pool.query(
        "SELECT statut, COUNT(*) AS total FROM presences WHERE session_id = ? GROUP BY statut",
        [id]
    );
    const resume = recap.map((r) => `${r.total} ${r.statut}`).join(", ");

    const [admins] = await pool.query("SELECT id FROM administrateurs");
    for (const admin of admins) {
        await pool.query(
            `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
       VALUES (?, 'fiche_presence', ?, ?)`,
            [
                admin.id,
                `Fiche de présence — ${session.prof_prenom} ${session.prof_nom} — ${session.matiere_nom} : ${resume}`,
                session.id,
            ]
        );
    }

    res.json({ message: "Fiche de présence envoyée à l'administration." });
}