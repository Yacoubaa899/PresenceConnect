import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function AdminProfesseurs() {
    const navigate = useNavigate();
    const [professeurs, setProfesseurs] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [profChoisi, setProfChoisi] = useState("");
    const [matiereChoisie, setMatiereChoisie] = useState("");
    const [succes, setSucces] = useState(null);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        const [listeProfesseurs, listeMatieres] = await Promise.all([
            apiFetch("/administration/professeurs"),
            apiFetch("/structure/matieres"),
        ]);
        setProfesseurs(listeProfesseurs);
        setMatieres(listeMatieres);
    }

    async function attribuer(e) {
        e.preventDefault();
        if (!profChoisi || !matiereChoisie) return;
        await apiFetch(`/administration/professeurs/${profChoisi}/matieres`, {
            method: "POST",
            body: { matiereId: matiereChoisie },
        });
        setSucces("Matière attribuée.");
        setMatiereChoisie("");
        charger();
    }

    async function retirer(profId, matiereId) {
        await apiFetch(`/administration/professeurs/${profId}/matieres/${matiereId}`, { method: "DELETE" });
        charger();
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Attribuer des matières</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone" style={{ background: "#7c3aed" }}>
                        <span className="icone">assignment</span>
                    </div>
                    <div>
                        <strong>Attribuer une matière</strong>
                        <span>Assignez une matière à un professeur.</span>
                    </div>
                </div>

                <form onSubmit={attribuer} className="ecran-auth-formulaire" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                    <div>
                        <label className="champ-icone-label">Professeur</label>
                        <select value={profChoisi} onChange={(e) => setProfChoisi(e.target.value)} style={{ width: "100%", padding: 11, borderRadius: 11, border: "1px solid var(--border)" }}>
                            <option value="">Choisir un professeur</option>
                            {professeurs.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="champ-icone-label">Matière</label>
                        <select value={matiereChoisie} onChange={(e) => setMatiereChoisie(e.target.value)} style={{ width: "100%", padding: 11, borderRadius: 11, border: "1px solid var(--border)" }}>
                            <option value="">Choisir une matière</option>
                            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bouton-bleu-fleche">
                        <span className="icone" style={{ fontSize: 17 }}>send</span> Attribuer
                    </button>
                    {succes && <p style={{ color: "var(--success)", fontSize: 12.5 }}>{succes}</p>}
                </form>

                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>
                        Professeurs et leurs matières
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {professeurs.map((p) => (
                            <div key={p.id} className="ligne-personne" style={{ flexDirection: "column", alignItems: "stretch" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div className="ligne-personne-avatar">{p.prenom?.[0]}{p.nom?.[0]}</div>
                                    <div className="ligne-personne-texte">
                                        <strong>{p.prenom} {p.nom}</strong>
                                        <span>{p.filiere_nom}{!p.actif && " · suspendu"}</span>
                                    </div>
                                </div>
                                <div className="tags-matieres" style={{ marginTop: 8 }}>
                                    {p.matieres.length === 0 && <span className="texte-discret">Aucune matière attribuée.</span>}
                                    {p.matieres.map((m) => (
                                        <span key={m.id} className="tag-matiere">
                                            {m.nom}
                                            <button onClick={() => retirer(p.id, m.id)} aria-label="Retirer">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}