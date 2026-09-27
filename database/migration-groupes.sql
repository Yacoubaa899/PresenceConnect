-- ============================================================
-- Migration : groupes améliorés (photo, adhésion validée, messages)
-- À exécuter dans phpMyAdmin, onglet SQL, sur la base existante.
-- ============================================================

ALTER TABLE groupes ADD COLUMN photo_groupe VARCHAR(255) NULL AFTER description;

CREATE TABLE groupes_demandes_adhesion (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  groupe_id     INT NOT NULL,
  etudiant_id   INT NOT NULL,
  statut        ENUM('en_attente','acceptee','refusee') NOT NULL DEFAULT 'en_attente',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (groupe_id, etudiant_id),
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

CREATE TABLE groupes_messages (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  groupe_id     INT NOT NULL,
  auteur_id     INT NOT NULL,
  contenu       TEXT NOT NULL,
  reponse_a     INT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (auteur_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (reponse_a) REFERENCES groupes_messages(id) ON DELETE SET NULL
);