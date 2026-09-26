import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { apiFetch, getUtilisateurConnecte, deconnecter } from "../../utils/api.js";

export default function EtudiantLayout() {
    const navigate = useNavigate();
    const utilisateur = getUtilisateurConnecte();
    const [notifications, setNotifications] = useState([]);
    const [notifOuvertes, setNotifOuvertes] = useState(false);
    const [notifSelectionnee, setNotifSelectionnee] = useState(null);

    useEffect(() => {
        if (!utilisateur || utilisateur.role !== "etudiant") {
            navigate("/connexion");
            return;
        }
        chargerNotifications();
    }, []);

    async function chargerNotifications() {
        try {
            setNotifications(await apiFetch("/notifications"));
        } catch { }
    }

    async function ouvrirNotifications() {
        setNotifOuvertes((v) => !v);
        if (!notifOuvertes) {
            await apiFetch("/notifications/tout-marquer-lu", { method: "POST" });
            chargerNotifications();
        }
    }

    async function supprimerNotification(id) {
        await apiFetch(`/notifications/${id}`, { method: "DELETE" });
        setNotifSelectionnee(null);
        chargerNotifications();
    }

    async function supprimerToutesNotifications() {
        await apiFetch("/notifications/tout-supprimer", { method: "DELETE" });
        chargerNotifications();
    }

    function seDeconnecter() {
        deconnecter();
        navigate("/connexion");
    }

    const nonLues = notifications.filter((n) => !n.lu).length;

    return (
        <div className="app-shell">
            <header className="app-topbar">
                <div className="app-brand">
                    <div className="app-brand-mark">PC</div>
                    <span className="app-brand-name">PresenceConnect</span>
                </div>
                <div className="app-topbar-right">
                    <span className="role-pill">Étudiant</span>
                    <div className="notif-conteneur">
                        <button className="bell-button" onClick={ouvrirNotifications} aria-label="Notifications">
                            <span className="icone">notifications</span>
                            {nonLues > 0 && <span className="bell-dot" />}
                        </button>
                        {notifOuvertes && (
                            <div className="notif-panneau">
                                {notifications.length === 0 && <p className="texte-discret" style={{ padding: 12 }}>Aucune notification.</p>}
                                {notifications.map((n) => (
                                    <div key={n.id} className="notif-ligne" onClick={() => setNotifSelectionnee(notifSelectionnee === n.id ? null : n.id)}>
                                        <div>{n.contenu}</div>
                                        {notifSelectionnee === n.id && (
                                            <button className="notif-supprimer" onClick={(e) => { e.stopPropagation(); supprimerNotification(n.id); }}>
                                                Supprimer
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {notifications.length > 0 && (
                                    <button className="notif-tout-supprimer" onClick={supprimerToutesNotifications}>
                                        Supprimer toutes les notifications
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <button className="lien-discret" onClick={seDeconnecter}>Déconnexion</button>
                </div>
            </header>

            <div className="rail">
                <NavLink to="/etudiant/ia" className="rail-btn">
                    <span className="icone">auto_awesome</span>
                    <span>IA</span>
                </NavLink>
                <NavLink to="/etudiant/groupes" className="rail-btn">
                    <span className="icone">group</span>
                    <span>Groupe</span>
                </NavLink>
            </div>

            <main className="app-content">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/etudiant" end className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">home</span>Accueil
                </NavLink>
                <NavLink to="/etudiant/info" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">info</span>Info
                </NavLink>
                <NavLink to="/etudiant/bibliotheque" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">menu_book</span>Bibliothèque
                </NavLink>
                <NavLink to="/etudiant/planning" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">calendar_month</span>Planning
                </NavLink>
                <NavLink to="/etudiant/profil" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">person</span>Profil
                </NavLink>
            </nav>
        </div>
    );
}