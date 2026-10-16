import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function AdminAttribuerNotesPage() {
    const navigate = useNavigate();
    const [matieres, setMatieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [etudiants, setEtudiants] = useState([]);

    const [matiereId, setMatiereId] = useState("");
    const [classeId, setClasseId] = useState("");
    const [valeurs, setValeurs] = useState({});
    const [enregistres, setEnregistres] = useState({});

    useEffect(() => {
        Promise.all([apiFetch("/structure/matieres"), apiFetch("/structure/classes"), apiFetch("/administration/etudiants")])
            .then(([m, c, e]) => { setMatieres(m); setClasses(c); setEtudiants(e); });
    }, []);

    const classeChoisie = classes.find((c) => String(c.id) === classeId);
    const etudiantsDeLaClasse = classeChoisie ? etudiants.filter((e) => e.classe_nom === classeChoisie.nom) : [];

    async function enregistrer(etudiantId) {
        const valeur = valeurs[etudiantId];
        if (!valeur || !matiereId) return;
        await apiFetch("/administration/notes", { method: "POST", body: { etudiantId, matiereId, valeur } });
        setEnregistres((prev) => ({ ...prev, [etudiantId]: true }));
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Attribuer des notes</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone" style={{ background: "#f0923c" }}>
                        <span className="icone">edit_note</span>
                    </div>
                    <div>
                        <strong>Attribuer des notes</strong>
                        <span>Saisissez les notes des élèves.</span>
                    </div>
                </div>

                <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} style={{ padding: 11, borderRadius: 11, border: "1px solid var(--border)" }}>
                    <option value="">Choisir une matière</option>
                    {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>

                <select value={classeId} onChange={(e) => setClasseId(e.target.value)} style={{ padding: 11, borderRadius: 11, border: "1px solid var(--border)" }}>
                    <option value="">Choisir une classe</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>

                {classeId && matiereId && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {etudiantsDeLaClasse.map((e) => (
                            <div key={e.id} className="ligne-liste">
                                <span>{e.prenom} {e.nom}</span>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <input
                                        type="number" min="0" max="20" step="0.5" placeholder="/20"
                                        value={valeurs[e.id] || ""}
                                        onChange={(ev) => { setValeurs({ ...valeurs, [e.id]: ev.target.value }); setEnregistres({ ...enregistres, [e.id]: false }); }}
                                        style={{ width: 56, padding: 7, borderRadius: 8, border: "1px solid var(--border)", textAlign: "center" }}
                                    />
                                    <button className="bouton-pilule" onClick={() => enregistrer(e.id)}>
                                        {enregistres[e.id] ? "Enregistré ✓" : "Enregistrer"}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {etudiantsDeLaClasse.length === 0 && <p className="texte-discret" style={{ textAlign: "center" }}>Aucun élève dans cette classe.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}