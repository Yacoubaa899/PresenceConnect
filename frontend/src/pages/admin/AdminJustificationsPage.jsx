import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

const ONGLETS = [
    { id: "en_attente", libelle: "En attente" },
    { id: "valide", libelle: "Validées" },
    { id: "refuse", libelle: "Refusées" },
];

export default function AdminJustificationsPage() {
    const navigate = useNavigate();
    const [justificatifs, setJustificatifs] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [onglet, setOnglet] = useState("en_attente");

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setJustificatifs(await apiFetch("/administration/justificatifs"));
    }

    async function traiter(id, decision) {
        await apiFetch(`/administration/justificatifs/${id}/traiter`, { method: "POST", body: { decision } });
        charger();
    }

    const filtres = justificatifs.filter((j) => {
        const correspondOnglet = j.statut === onglet;
        const correspondRecherche = !recherche || `${j.prenom} ${j.nom}`.toLowerCase().includes(recherche.toLowerCase());
        return correspondOnglet && correspondRecherche;
    });
    const compter = (statut) => justificatifs.filter((j) => j.statut === statut).length;

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Justifications</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone" style={{ background: "#f0486e" }}>
                        <span className="icone">fact_check</span>
                    </div>
                    <div>
                        <strong>Justifications</strong>
                        <span>Consultez les justificatifs d'absences.</span>
                    </div>
                </div>

                <div className="champ-recherche-icone">
                    <span className="icone">search</span>
                    <input placeholder="Rechercher un élève..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                </div>

                <div className="onglets-statut">
                    {ONGLETS.map((o) => (
                        <button key={o.id} className={"onglet-statut" + (onglet === o.id ? " actif" : "")} onClick={() => setOnglet(o.id)}>
                            {o.libelle} ({compter(o.id)})
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtres.map((j) => (
                        <div key={j.id} className="ligne-liste" style={{ flexDirection: "column", alignItems: "stretch" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <strong>{j.prenom} {j.nom}</strong>
                                    <div className="texte-discret">{new Date(j.date_soumission).toLocaleDateString("fr-FR")}</div>
                                </div>
                                {j.fichier && (
                                    <a href={`http://localhost:4000${j.fichier}`} target="_blank" rel="noreferrer" className="bouton-pilule secondaire">
                                        Voir
                                    </a>
                                )}
                            </div>
                            {onglet === "en_attente" && (
                                <div className="actions-ligne" style={{ marginTop: 8 }}>
                                    <button className="bouton-petit succes" onClick={() => traiter(j.id, "valide")}>Valider</button>
                                    <button className="bouton-petit danger" onClick={() => traiter(j.id, "refuse")}>Refuser</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filtres.length === 0 && <p className="texte-discret" style={{ textAlign: "center" }}>Aucun justificatif dans cette catégorie.</p>}
                </div>
            </div>
        </div>
    );
}