import { pool } from "../config/db.js";
import { hashSecret, verifySecret, generateNumericCode } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";
import { envoyerEmail } from "../utils/mail.js";
import crypto from "crypto";

// ============================================================
// ÉTUDIANT — inscription libre (seul rôle concerné)
// ============================================================

export async function registerStudent(req, res) {
  const {
    nom,
    prenom,
    numeroEtudiant,
    email,
    motDePasse,
    telephone,
    quartier,
    telephoneParent,
    sexe,
    age,
    filiereId,
    classeId,
  } = req.body;

  if (
    !nom || !prenom || !numeroEtudiant || !email || !motDePasse ||
    !telephone || !telephoneParent || !sexe || !age || !filiereId || !classeId
  ) {
    return res.status(400).json({ erreur: "Merci de renseigner tous les champs obligatoires." });
  }

  const connection = await pool.getConnection();
  try {
    // Un e-mail ou un numéro d'étudiant déjà utilisé ne doit pas créer de doublon.
    const [existants] = await connection.query(
      "SELECT id FROM etudiants WHERE email = ? OR numero_etudiant = ?",
      [email, numeroEtudiant]
    );
    if (existants.length > 0) {
      return res.status(409).json({ erreur: "Un compte existe déjà avec cet e-mail ou ce numéro d'étudiant." });
    }

    // Le contrôle de compte est un réglage global défini par l'administration.
    const [[parametres]] = await connection.query(
      "SELECT controle_compte_actif FROM parametres_admin WHERE id = 1"
    );
    const compteValide = !parametres.controle_compte_actif;

    const motDePasseHash = await hashSecret(motDePasse);

    // Code parent = numéro du parent + 4 chiffres aléatoires, généré automatiquement.
    let codeParent;
    let codeParentDisponible = false;
    while (!codeParentDisponible) {
      codeParent = `${telephoneParent}${generateNumericCode(4)}`;
      const [conflit] = await connection.query(
        "SELECT id FROM etudiants WHERE code_parent = ?",
        [codeParent]
      );
      codeParentDisponible = conflit.length === 0;
    }

    await connection.beginTransaction();

    const [utilisateur] = await connection.query(
      "INSERT INTO utilisateurs (role) VALUES ('etudiant')"
    );
    const etudiantId = utilisateur.insertId;

    await connection.query(
      `INSERT INTO etudiants
        (id, nom, prenom, numero_etudiant, email, mot_de_passe_hash, telephone, quartier,
         telephone_parent, code_parent, sexe, age, filiere_id, classe_id, compte_valide)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        etudiantId, nom, prenom, numeroEtudiant, email, motDePasseHash, telephone, quartier || null,
        telephoneParent, codeParent, sexe, age, filiereId, classeId, compteValide,
      ]
    );

    await connection.query(
      "INSERT INTO parents_etudiants (telephone_parent, etudiant_id) VALUES (?, ?)",
      [telephoneParent, etudiantId]
    );

    if (!compteValide) {
      // Prévenir l'administration qu'un compte attend une validation.
      const [admins] = await connection.query("SELECT id FROM administrateurs");
      for (const admin of admins) {
        await connection.query(
          `INSERT INTO notifications (utilisateur_id, type, contenu, lien_id)
           VALUES (?, 'compte_en_attente', ?, ?)`,
          [admin.id, `Nouveau compte à valider : ${prenom} ${nom}`, etudiantId]
        );
      }
    }

    await connection.commit();

    return res.status(201).json({
      message: compteValide
        ? "Compte créé. Vous pouvez vous connecter."
        : "Compte créé. En attente de validation par l'administration.",
      compteValide,
    });
  } catch (erreur) {
    await connection.rollback();
    console.error(erreur);
    return res.status(500).json({ erreur: "Une erreur est survenue lors de l'inscription." });
  } finally {
    connection.release();
  }
}

// ============================================================
// ÉTUDIANT — connexion (email + mot de passe)
// ============================================================

export async function loginStudent(req, res) {
  const { email, motDePasse } = req.body;
  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: "E-mail et mot de passe requis." });
  }

  const [[etudiant]] = await pool.query(
    `SELECT e.*, u.actif FROM etudiants e
     JOIN utilisateurs u ON u.id = e.id
     WHERE e.email = ?`,
    [email]
  );

  if (!etudiant) {
    return res.status(401).json({ erreur: "Identifiants incorrects." });
  }
  if (!etudiant.actif) {
    return res.status(403).json({ erreur: "Ce compte a été suspendu." });
  }
  if (!etudiant.compte_valide) {
    return res.status(403).json({ erreur: "Compte en attente de validation par l'administration." });
  }

  const motDePasseValide = await verifySecret(motDePasse, etudiant.mot_de_passe_hash);
  if (!motDePasseValide) {
    return res.status(401).json({ erreur: "Identifiants incorrects." });
  }

  const token = signToken({ id: etudiant.id, role: "etudiant" });
  return res.json({
    token,
    utilisateur: {
      id: etudiant.id,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      role: "etudiant",
    },
  });
}

// ============================================================
// ADMINISTRATION — connexion par clé d'accès
// ============================================================

export async function loginAdmin(req, res) {
  const { cleAcces } = req.body;
  if (!cleAcces) {
    return res.status(400).json({ erreur: "Clé d'accès requise." });
  }

  const [admins] = await pool.query(
    `SELECT a.*, u.actif FROM administrateurs a
     JOIN utilisateurs u ON u.id = a.id`
  );

  // Il n'y a généralement qu'un compte administration : on compare la clé
  // fournie à chacun (il n'y en a qu'un ou deux au plus).
  for (const admin of admins) {
    if (!admin.actif) continue;
    const valide = await verifySecret(cleAcces, admin.cle_acces_hash);
    if (valide) {
      const token = signToken({ id: admin.id, role: "administration" });
      return res.json({
        token,
        utilisateur: { id: admin.id, nom: admin.nom, prenom: admin.prenom, role: "administration" },
      });
    }
  }

  return res.status(401).json({ erreur: "Clé d'accès incorrecte." });
}

// Modification de la clé d'accès admin, une fois connecté (voir middleware requireAuth).
export async function changerCleAdmin(req, res) {
  const { ancienneCle, nouvelleCle } = req.body;
  if (!ancienneCle || !nouvelleCle) {
    return res.status(400).json({ erreur: "Ancienne et nouvelle clé requises." });
  }

  const [[admin]] = await pool.query("SELECT * FROM administrateurs WHERE id = ?", [req.utilisateur.id]);
  const ancienneValide = await verifySecret(ancienneCle, admin.cle_acces_hash);
  if (!ancienneValide) {
    return res.status(401).json({ erreur: "L'ancienne clé est incorrecte." });
  }

  const nouvelleHash = await hashSecret(nouvelleCle);
  await pool.query("UPDATE administrateurs SET cle_acces_hash = ? WHERE id = ?", [nouvelleHash, admin.id]);
  return res.json({ message: "Clé d'accès mise à jour." });
}

// ============================================================
// PROFESSEUR — connexion par clé d'accès permanente
// ============================================================

export async function loginTeacher(req, res) {
  const { cleAcces } = req.body;
  if (!cleAcces) {
    return res.status(400).json({ erreur: "Clé d'accès requise." });
  }

  const [profs] = await pool.query(
    `SELECT p.*, u.actif FROM professeurs p
     JOIN utilisateurs u ON u.id = p.id`
  );

  for (const prof of profs) {
    if (!prof.actif) continue;
    const valide = await verifySecret(cleAcces, prof.cle_acces_hash);
    if (valide) {
      const token = signToken({ id: prof.id, role: "professeur" });
      return res.json({
        token,
        utilisateur: { id: prof.id, nom: prof.nom, prenom: prof.prenom, role: "professeur" },
      });
    }
  }

  return res.status(401).json({ erreur: "Clé d'accès incorrecte ou expirée." });
}

// ============================================================
// PARENT — connexion par téléphone + code parent
// ============================================================

export async function loginParent(req, res) {
  const { telephone, codeParent } = req.body;
  if (!telephone || !codeParent) {
    return res.status(400).json({ erreur: "Numéro de téléphone et code parent requis." });
  }

  const codeComplet = `${telephone}${codeParent}`;
  const [[etudiant]] = await pool.query(
    "SELECT id, nom, prenom FROM etudiants WHERE telephone_parent = ? AND code_parent = ?",
    [telephone, codeComplet]
  );

  if (!etudiant) {
    return res.status(401).json({ erreur: "Numéro ou code parent incorrect." });
  }

  // Le token de connexion identifie le parent par l'enfant suivi.
  const token = signToken({ etudiantId: etudiant.id, role: "parent" });
  return res.json({
    token,
    utilisateur: { role: "parent", enfant: { id: etudiant.id, nom: etudiant.nom, prenom: etudiant.prenom } },
  });
}

// ============================================================
// MOT DE PASSE OUBLIÉ (étudiant) — demande d'un lien de réinitialisation
// ============================================================

export async function demanderReinitialisation(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erreur: "E-mail requis." });

  const [[etudiant]] = await pool.query("SELECT id FROM etudiants WHERE email = ?", [email]);

  console.log(`\n[Mot de passe oublié] Demande reçue pour : ${email}`);

  const reponseGenerique = {
    message: "Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.",
  };
  // MODE TEST (désactivé par défaut) : affiche le lien directement dans la réponse
  // pour pouvoir tester sans service d'e-mail. Ne JAMAIS l'activer en production.
  const modeTest = process.env.DEV_AFFICHER_LIEN_RESET === "true";

  if (!etudiant) {
    console.log("[Mot de passe oublié] Aucun étudiant trouvé avec cet e-mail : aucun lien généré.\n");
    return res.json({
      ...reponseGenerique,
      ...(modeTest ? { devInfo: "Mode test : aucun étudiant trouvé avec cet e-mail." } : {}),
    });
  }

  const tokenEnClair = crypto.randomBytes(32).toString("hex");
  const tokenHash = await hashSecret(tokenEnClair);
  const dateExpiration = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    "INSERT INTO reinitialisations_mot_de_passe (etudiant_id, token_hash, date_expiration) VALUES (?, ?, ?)",
    [etudiant.id, tokenHash, dateExpiration]
  );

  const lien = `http://localhost:5173/reinitialiser-mot-de-passe?token=${tokenEnClair}&id=${etudiant.id}`;

  console.log("\n📧 Lien de réinitialisation généré :");
  console.log(lien, "\n");

  let emailEnvoye = false;
  let erreurEmail = null;
  try {
    await envoyerEmail({
      destinataire: email,
      sujet: "Réinitialisation de votre mot de passe — PresenceConnect",
      texte: `Vous avez demandé à réinitialiser votre mot de passe.\n\nCliquez sur ce lien (valable 1 heure) :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
      html: `
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p><a href="${lien}">Cliquez ici pour choisir un nouveau mot de passe</a> (valable 1 heure).</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
      `,
    });
    emailEnvoye = true;
    console.log(`[Mot de passe oublié] E-mail envoyé avec succès à ${email}.\n`);
  } catch (erreur) {
    erreurEmail = erreur.message;
    console.log(`[Mot de passe oublié] Envoi de l'e-mail impossible : ${erreurEmail}\n`);
  }

  res.json({
    ...reponseGenerique,
    ...(modeTest ? { devLien: lien, devInfo: emailEnvoye ? "E-mail envoyé avec succès." : `E-mail non envoyé : ${erreurEmail}` } : {}),
  });
}

export async function reinitialiserMotDePasse(req, res) {
  const { id, token, nouveauMotDePasse } = req.body;
  if (!id || !token || !nouveauMotDePasse) {
    return res.status(400).json({ erreur: "Requête incomplète." });
  }

  const [demandes] = await pool.query(
    `SELECT * FROM reinitialisations_mot_de_passe
     WHERE etudiant_id = ? AND utilise = FALSE AND date_expiration > NOW()
     ORDER BY date_creation DESC`,
    [id]
  );

  let demandeValide = null;
  for (const demande of demandes) {
    if (await verifySecret(token, demande.token_hash)) {
      demandeValide = demande;
      break;
    }
  }

  if (!demandeValide) {
    return res.status(400).json({ erreur: "Ce lien est invalide ou a expiré. Refaites une demande." });
  }

  const nouveauHash = await hashSecret(nouveauMotDePasse);
  await pool.query("UPDATE etudiants SET mot_de_passe_hash = ? WHERE id = ?", [nouveauHash, id]);
  await pool.query("UPDATE reinitialisations_mot_de_passe SET utilise = TRUE WHERE id = ?", [demandeValide.id]);

  res.json({ message: "Mot de passe mis à jour. Vous pouvez vous connecter." });
}