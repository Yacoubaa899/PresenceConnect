import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

const ONGLETS = [
    { id: "en_attente", libelle: "En attente" },
    { id: "actif", libelle: "Activés" },
    { id: "desactive", libelle: "Désactivés" },
];

export default function AdminActivationComptes() {
    const navigate = useNavigate();
    const [comptes, setComptes] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [role, setRole] = useState("");
    const [onglet, setOnglet] = useState("en_attente");

    useEffect(() => {
        charger("", "");
    }, []);

    async function charger(r, rl) {
        const params = new URLSearchParams();
        if (r) params.append("recherche", r);
        if (rl) params.append("role", rl);
        const resultat = await apiFetch(`/administration/comptes?${params.toString()}`);
        setComptes(resultat);
    }

    async function activer(compte) {
        if (compte.statut === "en_attente") {
            await apiFetch(`/administration/comptes-en-attente/${compte.id}/valider`, { method: "POST" });
        } else {
            await apiFetch(`/administration/comptes/${compte.id}/reactiver`, { method: "POST" });
        }
        charger(recherche, role);
    }

    const filtres = comptes.filter((c) => c.statut === onglet);
    const compter = (statut) => comptes.filter((c) => c.statut === statut).length;

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Activation des comptes</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone" style={{ background: "#2f7ff5" }}>
                        <span className="icone">groups</span>
                    </div>
                    <div>
                        <strong>Activation des comptes</strong>
                        <span>Activez les comptes des élèves et professeurs.</span>
                    </div>
                </div>

                <div className="champ-recherche-icone">
                    <span className="icone">search</span>
                    <input
                        placeholder="Rechercher un nom, un e-mail..."
                        value={recherche}
                        onChange={(e) => { setRecherche(e.target.value); charger(e.target.value, role); }}
                    />
                </div>

                <select value={role} onChange={(e) => { setRole(e.target.value); charger(recherche, e.target.value); }} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}>
                    <option value="">Tous les rôles</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="professeur">Professeur</option>
                </select>

                <div className="onglets-statut">
                    {ONGLETS.map((o) => (
                        <button key={o.id} className={"onglet-statut" + (onglet === o.id ? " actif" : "")} onClick={() => setOnglet(o.id)}>
                            {o.libelle} ({compter(o.id)})
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtres.map((c) => (
                        <div key={`${c.role}-${c.id}`} className="ligne-personne">
                            <div className="ligne-personne-avatar">{c.prenom?.[0]}{c.nom?.[0]}</div>
                            <div className="ligne-personne-texte">
                                <strong>{c.prenom} {c.nom}</strong>
                                <span>{c.role === "etudiant" ? "Étudiant" : "Professeur"}{c.email ? ` · ${c.email}` : ""}</span>
                            </div>
                            {c.statut !== "actif" && (
                                <button className="bouton-pilule" onClick={() => activer(c)}>Activer</button>
                            )}
                        </div>
                    ))}
                    {filtres.length === 0 && <p className="texte-discret" style={{ textAlign: "center" }}>Aucun compte dans cette catégorie.</p>}
                </div>
            </div>
        </div>
    );
}