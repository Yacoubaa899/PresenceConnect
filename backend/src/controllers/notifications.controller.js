import { pool } from "../config/db.js";

export async function mesNotifications(req, res) {
    const [notifications] = await pool.query(
        "SELECT * FROM notifications WHERE utilisateur_id = ? ORDER BY created_at DESC LIMIT 50",
        [req.utilisateur.id]
    );
    res.json(notifications);
}

export async function marquerNotificationLue(req, res) {
    const { id } = req.params;
    await pool.query(
        "UPDATE notifications SET lu = TRUE WHERE id = ? AND utilisateur_id = ?",
        [id, req.utilisateur.id]
    );
    res.json({ message: "Notification marquée comme lue." });
}

export async function marquerToutesLues(req, res) {
    await pool.query(
        "UPDATE notifications SET lu = TRUE WHERE utilisateur_id = ?",
        [req.utilisateur.id]
    );
    res.json({ message: "Toutes les notifications sont marquées comme lues." });
}

export async function supprimerNotification(req, res) {
    const { id } = req.params;
    await pool.query(
        "DELETE FROM notifications WHERE id = ? AND utilisateur_id = ?",
        [id, req.utilisateur.id]
    );
    res.json({ message: "Notification supprimée." });
}

export async function supprimerToutesNotifications(req, res) {
    await pool.query("DELETE FROM notifications WHERE utilisateur_id = ?", [req.utilisateur.id]);
    res.json({ message: "Toutes les notifications ont été supprimées." });
}