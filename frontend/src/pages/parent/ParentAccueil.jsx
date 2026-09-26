import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

const LIBELLES_STATUT = { present: "Présent", retard: "Retard", absent: "Absent" };

export default function ParentAccueil() {
    const [enfant, setEnfant] = useState(null);
    const [stats, setStats] = useState(null);
    const [historique, setHistorique] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setChargement(true);
        try {
            const [infoEnfant, statistiques, hist] = await Promise.all([
                apiFetch("/parent/mon-enfant"),
                apiFetch("/parent/mon-enfant/statistiques"),
                apiFetch("/parent/mon-enfant/historique"),
            ]);
            setEnfant(infoEnfant);
            setStats(statistiques);
            setHistorique(hist);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    if (chargement) return <p style={{ padding: 18 }}>Chargement...</p>;

    return (
        <div className="onglet-contenu">
            {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

            {enfant && (
                <section className="box admin-section">
                    <h2>{enfant.prenom} {enfant.nom}</h2>
                    <p className="texte-discret">{enfant.filiere_nom} — {enfant.classe_nom}</p>
                </section>
            )}

            {stats && (
                <section className="box admin-section">
                    <h2>Assiduité</h2>
                    <div className="gauge-row">
                        <div className="gauge" style={{ background: `conic-gradient(var(--success) 0 ${stats.pourcentageAssiduite}%, var(--border) ${stats.pourcentageAssiduite}% 100%)` }}>
                            <div className="gauge-hole">{stats.pourcentageAssiduite}%</div>
                        </div>
                        <div className="texte-discret">
                            {stats.presents} présent(s) · {stats.retards} retard(s) · {stats.absents} absence(s)<br />
                            sur {stats.total} cours enregistré(s)
                        </div>
                    </div>
                </section>
            )}

            <section className="box admin-section">
                <h2>Historique récent</h2>
                {historique.length === 0 && <p className="texte-discret">Aucune présence enregistrée pour l'instant.</p>}
                {historique.map((h, i) => (
                    <div key={i} className="ligne-liste">
                        <div>
                            <strong>{h.matiere_nom}</strong>
                            <div className="texte-discret">
                                {new Date(h.date_debut).toLocaleDateString("fr-FR")} à{" "}
                                {new Date(h.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                        <span className={"tag-statut " + h.statut}>{LIBELLES_STATUT[h.statut]}</span>
                    </div>
                ))}
            </section>
        </div>
    );
}