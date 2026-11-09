import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getUtilisateurConnecte } from "../../utils/api.js";
import EnteteApp from "../../components/EnteteApp.jsx";

// Pages où l'en-tête "Administration / Bienvenue / cloche" doit apparaître.
// Sur toutes les autres (sous-pages), c'est l'en-tête de la sous-page
// (flèche retour + titre) qui le remplace : jamais les deux en même temps.
const PAGES_AVEC_ENTETE_ROLE = ["/admin", "/admin/info", "/admin/planning", "/admin/bibliotheque"];

// Pages qui correspondent à un onglet de la barre du bas autre qu'Accueil.
const AUTRES_ONGLETS = ["/admin/info", "/admin/planning", "/admin/bibliotheque", "/admin/profil"];

export default function AdminLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const utilisateur = getUtilisateurConnecte();

    useEffect(() => {
        if (!utilisateur || utilisateur.role !== "administration") {
            navigate("/connexion");
        }
    }, []);

    if (!utilisateur) return null;

    const cheminNettoye = pathname.replace(/\/$/, "") || "/admin";
    const afficherEntete = PAGES_AVEC_ENTETE_ROLE.includes(cheminNettoye);

    // "Accueil" reste surligné sur toutes les sous-pages (élèves, absences...).
    const accueilActif = !AUTRES_ONGLETS.some((p) => cheminNettoye.startsWith(p));

    return (
        <div className="app-shell">
            {afficherEntete && <EnteteApp utilisateur={utilisateur} />}

            <main className="app-content contenu-admin">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/admin" className={"nav-item" + (accueilActif ? " actif" : "")}>
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