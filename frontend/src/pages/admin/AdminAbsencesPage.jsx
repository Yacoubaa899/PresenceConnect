import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function AdminAbsencesPage() {
    const navigate = useNavigate();
    const [absences, setAbsences] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [filiereId, setFiliereId] = useState("");
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");

    useEffect(() => {
        apiFetch("/structure/filieres").then(setFilieres).catch(() => { });
        charger({});
    }, []);

    async function charger(filtre) {
        const params = new URLSearchParams();
        if (filtre.recherche) params.append("recherche", filtre.recherche);
        if (filtre.filiereId) params.append("filiereId", filtre.filiereId);
        if (filtre.dateDebut) params.append("dateDebut", filtre.dateDebut);
        if (filtre.dateFin) params.append("dateFin", filtre.dateFin);
        const resultat = await apiFetch(`/administration/absences?${params.toString()}`);
        setAbsences(resultat);
    }

    function appliquer(nouveau) {
        const filtre = { recherche, filiereId, dateDebut, dateFin, ...nouveau };
        setRecherche(filtre.recherche);
        setFiliereId(filtre.filiereId);
        setDateDebut(filtre.dateDebut);
        setDateFin(filtre.dateFin);
        charger(filtre);
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Absences</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone" style={{ background: "#16a34a" }}>
                        <span className="icone">event_busy</span>
                    </div>
                    <div>
                        <strong>Gestion des absences</strong>
                        <span>Consultez les absences des élèves.</span>
                    </div>
                </div>

                <div className="champ-recherche-icone">
                    <span className="icone">search</span>
                    <input placeholder="Rechercher un élève..." value={recherche} onChange={(e) => appliquer({ recherche: e.target.value })} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <input type="date" value={dateDebut} onChange={(e) => appliquer({ dateDebut: e.target.value })} style={{ flex: 1, padding: 9, borderRadius: 10, border: "1px solid var(--border)", fontSize: 12.5 }} />
                    <input type="date" value={dateFin} onChange={(e) => appliquer({ dateFin: e.target.value })} style={{ flex: 1, padding: 9, borderRadius: 10, border: "1px solid var(--border)", fontSize: 12.5 }} />
                </div>

                <select value={filiereId} onChange={(e) => appliquer({ filiereId: e.target.value })} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}>
                    <option value="">Toutes les filières</option>
                    {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {absences.map((a) => (
                        <div key={a.id} className="ligne-liste">
                            <div>
                                <strong>{a.prenom} {a.nom}</strong>
                                <div className="texte-discret">{a.filiere_nom} — {new Date(a.date_debut).toLocaleDateString("fr-FR")}</div>
                            </div>
                            <span className={"tag-statut " + (a.justifiee ? "present" : "absent")}>
                                {a.justifiee ? "Justifiée" : "Absente"}
                            </span>
                        </div>
                    ))}
                    {absences.length === 0 && <p className="texte-discret" style={{ textAlign: "center" }}>Aucune absence trouvée.</p>}
                </div>
            </div>
        </div>
    );
}