-- ============================================================
-- PresenceConnect — Schéma de base de données (Version 1)
-- Un seul établissement, sans module ESP32 (validation manuelle
-- par le professeur pour l'instant).
-- ============================================================

CREATE DATABASE IF NOT EXISTS presenceconnect
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE presenceconnect;

-- ------------------------------------------------------------
-- 1. STRUCTURE ACADÉMIQUE
-- ------------------------------------------------------------

CREATE TABLE filieres (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(150) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(150) NOT NULL,        -- ex: "L2 Réseaux Informatiques"
  filiere_id    INT NOT NULL,
  annee         VARCHAR(20) NOT NULL,          -- ex: "2026-2027"
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
);

CREATE TABLE matieres (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(150) NOT NULL,
  filiere_id    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 2. UTILISATEURS
-- Une table commune pour le rôle et le statut, puis une table
-- par rôle pour les champs spécifiques (les 4 rôles ont des
-- informations et des méthodes de connexion très différentes).
-- ------------------------------------------------------------

CREATE TABLE utilisateurs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  role          ENUM('etudiant','professeur','administration','parent') NOT NULL,
  actif         BOOLEAN NOT NULL DEFAULT TRUE,   -- suspension de compte
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parametres_admin (
  id                          INT PRIMARY KEY DEFAULT 1,
  controle_compte_actif       BOOLEAN NOT NULL DEFAULT FALSE,
  delai_retard_minutes        INT NOT NULL DEFAULT 10,
  CONSTRAINT un_seul_parametre CHECK (id = 1)
);
INSERT INTO parametres_admin (id, controle_compte_actif, delai_retard_minutes)
VALUES (1, FALSE, 10);

-- Administration : accès par clé (une clé par défaut définie au
-- déploiement, modifiable ensuite par l'admin lui-même). Pas d'inscription.
CREATE TABLE administrateurs (
  id                INT PRIMARY KEY,             -- = utilisateurs.id
  nom               VARCHAR(100) NOT NULL,
  prenom            VARCHAR(100) NOT NULL,
  cle_acces_hash    VARCHAR(255) NOT NULL,        -- clé hachée (bcrypt), jamais en clair
  photo_profil      VARCHAR(255),
  FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Étudiants : seul rôle avec inscription libre (email + mot de passe).
CREATE TABLE etudiants (
  id                    INT PRIMARY KEY,          -- = utilisateurs.id
  nom                   VARCHAR(100) NOT NULL,
  prenom                VARCHAR(100) NOT NULL,
  numero_etudiant       VARCHAR(50) NOT NULL UNIQUE,
  email                 VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe_hash     VARCHAR(255) NOT NULL,
  telephone             VARCHAR(30) NOT NULL,
  quartier              VARCHAR(150),
  telephone_parent      VARCHAR(30) NOT NULL,     -- sert de base au code_parent
  code_parent           VARCHAR(20) NOT NULL UNIQUE, -- telephone_parent + 4 chiffres aléatoires
  sexe                  ENUM('M','F') NOT NULL,
  age                   INT NOT NULL,
  filiere_id            INT NOT NULL,
  classe_id             INT NOT NULL,
  photo_profil          VARCHAR(255),
  compte_valide         BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = en attente de validation admin
  FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id),
  FOREIGN KEY (classe_id) REFERENCES classes(id)
);

-- Professeurs : accès par clé temporaire générée par l'admin.
CREATE TABLE professeurs (
  id                INT PRIMARY KEY,              -- = utilisateurs.id
  nom               VARCHAR(100) NOT NULL,
  prenom            VARCHAR(100) NOT NULL,
  filiere_id        INT NOT NULL,
  licence           VARCHAR(100),
  nombre_heures     INT NOT NULL DEFAULT 0,       -- heures à dispenser, déclaré à l'activation
  cle_acces_hash    VARCHAR(255) NOT NULL,        -- clé permanente de connexion quotidienne (hachée)
  photo_profil      VARCHAR(255),
  FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);

-- Clés d'accès professeur : générées par l'admin, à durée limitée.
CREATE TABLE cles_professeur (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  cle_hash          VARCHAR(255) NOT NULL,
  professeur_id     INT NULL,                     -- rempli une fois la clé utilisée pour créer le compte
  genere_par_admin  INT NOT NULL,
  date_creation     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration   DATETIME NOT NULL,
  statut            ENUM('active','utilisee','expiree') NOT NULL DEFAULT 'active',
  FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE SET NULL,
  FOREIGN KEY (genere_par_admin) REFERENCES administrateurs(id)
);

-- Un professeur peut dispenser plusieurs matières.
CREATE TABLE professeurs_matieres (
  professeur_id     INT NOT NULL,
  matiere_id        INT NOT NULL,
  PRIMARY KEY (professeur_id, matiere_id),
  FOREIGN KEY (professeur_id) REFERENCES professeurs(id) ON DELETE CASCADE,
  FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE
);

-- Parents : pas de compte propre dans "utilisateurs" au sens strict,
-- ils se connectent avec le téléphone + code_parent de l'étudiant.
-- Table de liaison au cas où un parent suit plusieurs enfants.
CREATE TABLE parents_etudiants (
  telephone_parent  VARCHAR(30) NOT NULL,
  etudiant_id       INT NOT NULL,
  PRIMARY KEY (telephone_parent, etudiant_id),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

-- Réinitialisation de mot de passe (lien envoyé par e-mail).
CREATE TABLE reinitialisations_mot_de_passe (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id       INT NOT NULL,
  token_hash        VARCHAR(255) NOT NULL,
  date_creation     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration   DATETIME NOT NULL,
  utilise           BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 3. COURS ET PRÉSENCES
-- ------------------------------------------------------------

-- Une session = un cours ouvert par un prof à un instant donné,
-- pour une classe/filière précise (les présences y sont rattachées).
CREATE TABLE sessions_cours (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  matiere_id        INT NOT NULL,
  professeur_id     INT NOT NULL,
  classe_id         INT NOT NULL,
  date_debut        DATETIME NOT NULL,
  date_fin          DATETIME NULL,               -- rempli à la clôture
  heures_effectuees DECIMAL(4,2) NULL,
  statut            ENUM('ouverte','cloturee') NOT NULL DEFAULT 'ouverte',
  FOREIGN KEY (matiere_id) REFERENCES matieres(id),
  FOREIGN KEY (professeur_id) REFERENCES professeurs(id),
  FOREIGN KEY (classe_id) REFERENCES classes(id)
);

CREATE TABLE presences (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  session_id        INT NOT NULL,
  etudiant_id       INT NOT NULL,
  statut            ENUM('present','retard','absent') NOT NULL,
  methode            ENUM('mot_de_passe_confirme_prof','manuel_prof') NOT NULL,
  heure_validation  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, etudiant_id),
  FOREIGN KEY (session_id) REFERENCES sessions_cours(id) ON DELETE CASCADE,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

CREATE TABLE justificatifs (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id       INT NOT NULL,
  session_id        INT NULL,                    -- absence liée à une session précise, si applicable
  fichier           VARCHAR(255) NOT NULL,        -- chemin/référence du fichier stocké
  commentaire       TEXT,
  statut            ENUM('en_attente','valide','refuse') NOT NULL DEFAULT 'en_attente',
  date_soumission   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  traite_par_admin  INT NULL,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions_cours(id) ON DELETE SET NULL,
  FOREIGN KEY (traite_par_admin) REFERENCES administrateurs(id)
);

CREATE TABLE notes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id       INT NOT NULL,
  matiere_id        INT NOT NULL,
  valeur            DECIMAL(4,2) NOT NULL,
  envoye_par_admin  INT NOT NULL,
  date_envoi        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (matiere_id) REFERENCES matieres(id),
  FOREIGN KEY (envoye_par_admin) REFERENCES administrateurs(id)
);

-- ------------------------------------------------------------
-- 4. PUBLICATIONS (Info / Planning / Bibliothèque)
-- ------------------------------------------------------------

CREATE TABLE publications (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  categorie             ENUM('info','planning','bibliotheque') NOT NULL,
  type_contenu          ENUM('pdf','image','texte') NOT NULL,
  fichier               VARCHAR(255),             -- chemin du PDF/image, NULL si type = texte
  texte                 TEXT,                     -- texte seul, ou texte d'accompagnement du PDF/image
  auteur_admin_id       INT NULL,                 -- admin, pour info/planning/bibliotheque
  auteur_professeur_id  INT NULL,                 -- prof, uniquement pour bibliotheque
  matiere_id            INT NULL,                 -- si publication liée à un cours (bibliothèque prof)
  date_publication      TIMESTAMP NULL,           -- rempli à la publication effective
  est_programmee        BOOLEAN NOT NULL DEFAULT FALSE,
  date_programmee       DATETIME NULL,
  date_expiration       DATETIME NULL,            -- NULL = durée illimitée
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auteur_admin_id) REFERENCES administrateurs(id),
  FOREIGN KEY (auteur_professeur_id) REFERENCES professeurs(id),
  FOREIGN KEY (matiere_id) REFERENCES matieres(id),
  CONSTRAINT un_seul_auteur CHECK (
    (auteur_admin_id IS NOT NULL AND auteur_professeur_id IS NULL) OR
    (auteur_admin_id IS NULL AND auteur_professeur_id IS NOT NULL)
  )
);

-- ------------------------------------------------------------
-- 5. GROUPES ÉTUDIANTS
-- ------------------------------------------------------------

CREATE TABLE groupes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nom               VARCHAR(150) NOT NULL,
  description       VARCHAR(150),
  photo_groupe      VARCHAR(255),
  createur_id       INT NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createur_id) REFERENCES etudiants(id)
);

CREATE TABLE groupes_membres (
  groupe_id         INT NOT NULL,
  etudiant_id       INT NOT NULL,
  date_adhesion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (groupe_id, etudiant_id),
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

CREATE TABLE groupes_invitations (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  groupe_id         INT NOT NULL,
  invite_par        INT NOT NULL,                 -- etudiant_id
  etudiant_invite   INT NOT NULL,                 -- etudiant_id
  statut            ENUM('en_attente','acceptee','refusee') NOT NULL DEFAULT 'en_attente',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (invite_par) REFERENCES etudiants(id),
  FOREIGN KEY (etudiant_invite) REFERENCES etudiants(id)
);

-- Demande d'un étudiant pour rejoindre un groupe : doit être approuvée
-- par le créateur du groupe (contrairement à l'invitation, qui part du groupe).
CREATE TABLE groupes_demandes_adhesion (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  groupe_id         INT NOT NULL,
  etudiant_id       INT NOT NULL,
  statut            ENUM('en_attente','acceptee','refusee') NOT NULL DEFAULT 'en_attente',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (groupe_id, etudiant_id),
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

-- Messages échangés dans un groupe (texte, image ou PDF), avec réponse possible à un message précis.
CREATE TABLE groupes_messages (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  groupe_id         INT NOT NULL,
  auteur_id         INT NOT NULL,
  contenu           TEXT NULL,
  type_contenu      ENUM('texte','image','pdf') NOT NULL DEFAULT 'texte',
  fichier           VARCHAR(255) NULL,
  reponse_a         INT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (auteur_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (reponse_a) REFERENCES groupes_messages(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 6. NOTIFICATIONS (cloche, tous rôles)
-- ------------------------------------------------------------

CREATE TABLE notifications (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id    INT NOT NULL,                 -- destinataire (utilisateurs.id)
  type              VARCHAR(50) NOT NULL,         -- ex: 'justificatif', 'compte_en_attente', 'publication_prof', 'fiche_presence'
  contenu           VARCHAR(255) NOT NULL,
  lien_id           INT NULL,                     -- id de l'objet concerné (justificatif, session, etc.)
  lu                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Index utiles pour les recherches fréquentes
-- ------------------------------------------------------------
CREATE INDEX idx_etudiants_classe ON etudiants(classe_id);
CREATE INDEX idx_sessions_classe_date ON sessions_cours(classe_id, date_debut);
CREATE INDEX idx_presences_etudiant ON presences(etudiant_id);
CREATE INDEX idx_publications_categorie ON publications(categorie, date_expiration);
CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id, lu);