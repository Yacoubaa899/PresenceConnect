import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUtilisateurConnecte } from "../../utils/api.js";
import EnteteApp from "../../components/EnteteApp.jsx";

export default function AdminLayout() {
    const navigate = useNavigate();
    const utilisateur = getUtilisateurConnecte();

    useEffect(() => {
        if (!utilisateur || utilisateur.role !== "administration") {
            navigate("/connexion");
        }
    }, []);

    if (!utilisateur) return null;

    return (
        <div className="app-shell">
            <EnteteApp utilisateur={utilisateur} />

            <main className="app-content" style={{ padding: 0 }}>
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/admin" end className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">home</span>Accueil
                </NavLink>
                <NavLink to="/admin/info" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">info</span>Info
                </NavLink>
                <NavLink to="/admin/planning" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">calendar_month</span>Planning
                </NavLink>
                <NavLink to="/admin/bibliotheque" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">menu_book</span>Bibliothèque
                </NavLink>
                <NavLink to="/admin/profil" className={({ isActive }) => "nav-item" + (isActive ? " actif" : "")}>
                    <span className="icone">person</span>Profil
                </NavLink>
            </nav>
        </div>
    );
}