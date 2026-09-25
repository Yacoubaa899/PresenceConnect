import { pool } from "../config/db.js";

// Publie automatiquement les contenus programmés dont l'heure est arrivée.
async function publierContenusProgrammes() {
    await pool.query(
        `UPDATE publications
     SET date_publication = NOW()
     WHERE est_programmee = TRUE
       AND date_publication IS NULL
       AND date_programmee <= NOW()`
    );
}

// Supprime réellement les publications dont la durée est dépassée
// (le cahier des charges demande une suppression, pas juste un masquage).
async function supprimerPublicationsExpirees() {
    await pool.query(
        `DELETE FROM publications
     WHERE date_expiration IS NOT NULL AND date_expiration <= NOW()`
    );
}

// À appeler une fois au démarrage du serveur : vérifie ces deux tâches
// toutes les minutes, sans bloquer le reste de l'application.
export function demarrerTachesPlanifiees() {
    const uneMinute = 60 * 1000;
    setInterval(() => {
        publierContenusProgrammes().catch(console.error);
        supprimerPublicationsExpirees().catch(console.error);
    }, uneMinute);
}