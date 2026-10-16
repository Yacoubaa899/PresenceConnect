import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import ProfilEtudiantModal from "./ProfilEtudiantModal.jsx";

export default function AdminEleves() {
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [profilOuvert, setProfilOuvert] = useState(null);

    useEffect(() => {
        charger("");
    }, []);

    async function charger(valeur) {
        const resultat = await apiFetch(`/administration/etudiants?recherche=${encodeURIComponent(valeur)}`);
        setEtudiants(resultat);
    }

    function initiales(nom, prenom) {
        return `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Élèves</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone stat-eleves" style={{ background: "#1f6fe0" }}>
                        <span className="icone">groups</span>
                    </div>
                    <div>
                        <strong>Liste des élèves</strong>
                        <span>Consultez et recherchez parmi tous les élèves.</span>
                    </div>
                </div>

                <div className="champ-recherche-icone">
                    <span className="icone">search</span>
                    <input
                        placeholder="Rechercher un nom, une filière..."
                        value={recherche}
                        onChange={(e) => { setRecherche(e.target.value); charger(e.target.value); }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {etudiants.map((e) => (
                        <div key={e.id} className="ligne-personne" style={{ cursor: "pointer" }} onClick={() => setProfilOuvert(e.id)}>
                            <div className="ligne-personne-avatar">{initiales(e.nom, e.prenom)}</div>
                            <div className="ligne-personne-texte">
                                <strong>{e.prenom} {e.nom}</strong>
                                <span>{e.filiere_nom} — {e.classe_nom}{!e.actif && " · suspendu"}</span>
                            </div>
                        </div>
                    ))}
                    {etudiants.length === 0 && <p className="texte-discret" style={{ textAlign: "center" }}>Aucun résultat.</p>}
                </div>
            </div>

            {profilOuvert && (
                <ProfilEtudiantModal
                    etudiantId={profilOuvert}
                    afficherValidation={false}
                    onFermer={() => setProfilOuvert(null)}
                    onDecision={() => setProfilOuvert(null)}
                />
            )}
        </div>
    );
}