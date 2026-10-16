import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const LIBELLES_ROLE = {
    administration: "Administration",
    professeur: "Professeur",
    etudiant: "Étudiant",
    parent: "Parent",
};

export default function EnteteApp({ utilisateur, photo }) {
    const [notifications, setNotifications] = useState([]);
    const [ouvertes, setOuvertes] = useState(false);
    const [selectionnee, setSelectionnee] = useState(null);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        try {
            setNotifications(await apiFetch("/notifications"));
        } catch { }
    }

    async function ouvrir() {
        setOuvertes((v) => !v);
        if (!ouvertes) {
            await apiFetch("/notifications/tout-marquer-lu", { method: "POST" });
            charger();
        }
    }

    async function supprimer(id) {
        await apiFetch(`/notifications/${id}`, { method: "DELETE" });
        setSelectionnee(null);
        charger();
    }

    async function supprimerToutes() {
        await apiFetch("/notifications/tout-supprimer", { method: "DELETE" });
        charger();
    }

    const nonLues = notifications.filter((n) => !n.lu).length;
    const prenom = utilisateur?.prenom || utilisateur?.enfant?.prenom || "";
    const initiales = `${utilisateur?.prenom?.[0] || ""}${utilisateur?.nom?.[0] || ""}`.toUpperCase();

    return (
        <header className="entete-role">
            <div className="entete-role-gauche">
                <div className="entete-role-avatar">
                    {photo ? <img src={photo} alt="" /> : <span>{initiales || "?"}</span>}
                </div>
                <div>
                    <div className="entete-role-titre">{LIBELLES_ROLE[utilisateur?.role] || ""}</div>
                    <div className="entete-role-bienvenue">Bienvenue{prenom ? `, ${prenom}` : ""}</div>
                </div>
            </div>

            <div className="notif-conteneur">
                <button className="entete-role-cloche" onClick={ouvrir} aria-label="Notifications">
                    <span className="icone">notifications</span>
                    {nonLues > 0 && <span className="entete-role-badge">{nonLues}</span>}
                </button>
                {ouvertes && (
                    <div className="notif-panneau">
                        {notifications.length === 0 && <p className="texte-discret" style={{ padding: 12 }}>Aucune notification.</p>}
                        {notifications.map((n) => (
                            <div key={n.id} className="notif-ligne" onClick={() => setSelectionnee(selectionnee === n.id ? null : n.id)}>
                                <div>{n.contenu}</div>
                                {selectionnee === n.id && (
                                    <button className="notif-supprimer" onClick={(e) => { e.stopPropagation(); supprimer(n.id); }}>
                                        Supprimer
                                    </button>
                                )}
                            </div>
                        ))}
                        {notifications.length > 0 && (
                            <button className="notif-tout-supprimer" onClick={supprimerToutes}>
                                Supprimer toutes les notifications
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}