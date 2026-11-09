import { useNavigate } from "react-router-dom";
import { getUtilisateurConnecte, deconnecter } from "../../utils/api.js";

export default function AdminProfil() {
    const navigate = useNavigate();
    const utilisateur = getUtilisateurConnecte();

    function seDeconnecter() {
        deconnecter();
        navigate("/connexion");
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate("/admin")}><span className="icone">chevron_left</span></button>
                <h1>Mon profil</h1>
            </div>

            <div className="sous-page-contenu">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="entete-role-avatar" style={{ background: "var(--primary-soft)", color: "var(--primary)", width: 64, height: 64, fontSize: 20 }}>
                        {utilisateur?.prenom?.[0]}{utilisateur?.nom?.[0]}
                    </div>
                    <div>
                        <strong style={{ display: "block", fontSize: 16, color: "var(--primary-navy)" }}>
                            {utilisateur?.prenom} {utilisateur?.nom}
                        </strong>
                        <span className="texte-discret">Administrateur</span>
                    </div>
                </div>

                <div className="ecran-auth-formulaire" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                    <strong style={{ fontSize: 13, color: "var(--primary-navy)" }}>Informations personnelles</strong>
                    <div className="fiche-info">
                        <div><span>Nom complet</span><strong>{utilisateur?.prenom} {utilisateur?.nom}</strong></div>
                        <div><span>Rôle</span><strong>Administrateur</strong></div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button className="ligne-personne" style={{ cursor: "pointer", justifyContent: "space-between" }} onClick={() => navigate("/admin/cle-acces")}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="icone" style={{ color: "var(--primary)" }}>lock</span> Changer la clé d'accès
                        </span>
                        <span className="icone texte-discret">chevron_right</span>
                    </button>
                    <button className="ligne-personne" style={{ cursor: "pointer", justifyContent: "space-between" }} onClick={() => navigate("/admin/structure")}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="icone" style={{ color: "var(--primary)" }}>settings</span> Paramètres
                        </span>
                        <span className="icone texte-discret">chevron_right</span>
                    </button>
                    <button className="ligne-personne" style={{ cursor: "pointer", justifyContent: "space-between" }} onClick={seDeconnecter}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--danger)" }}>
                            <span className="icone">logout</span> Déconnexion
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}