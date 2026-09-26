import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function EtudiantAccueil() {
    const [sessionOuverte, setSessionOuverte] = useState(null);
    const [stats, setStats] = useState(null);
    const [justificatifs, setJustificatifs] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [fichier, setFichier] = useState(null);
    const [commentaire, setCommentaire] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [succes, setSucces] = useState(null);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setChargement(true);
        try {
            const [session, statistiques, mesJustificatifs] = await Promise.all([
                apiFetch("/sessions/ouverte-pour-moi"),
                apiFetch("/mes-statistiques"),
                apiFetch("/mes-justificatifs"),
            ]);
            setSessionOuverte(session);
            setStats(statistiques);
            setJustificatifs(mesJustificatifs);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function envoyerJustificatif(e) {
        e.preventDefault();
        if (!fichier) return;
        setEnvoiEnCours(true);
        setErreur(null);
        setSucces(null);
        try {
            const donnees = new FormData();
            donnees.append("fichier", fichier);
            if (commentaire) donnees.append("commentaire", commentaire);
            const resultat = await apiFetch("/justificatifs", { method: "POST", body: donnees });
            setSucces(resultat.message);
            setFichier(null);
            setCommentaire("");
            charger();
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    const LIBELLES_STATUT = { en_attente: "En attente", valide: "Validé", refuse: "Refusé" };

    if (chargement) return <p style={{ padding: 18 }}>Chargement...</p>;

    return (
        <div className="onglet-contenu">
            {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

            {sessionOuverte && (
                <section className="box admin-section" style={{ background: "var(--success-soft)", borderColor: "var(--success)" }}>
                    <h2 style={{ color: "var(--success)" }}>Émargement en cours — {sessionOuverte.matiere_nom}</h2>
                    <p className="texte-discret">
                        Session ouverte par votre professeur depuis{" "}
                        {new Date(sessionOuverte.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
                        Présentez-vous à votre professeur pour valider votre présence.
                    </p>
                </section>
            )}

            {stats && (
                <section className="box admin-section">
                    <h2>Mon assiduité</h2>
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
                <h2>Envoyer un justificatif</h2>
                <form onSubmit={envoyerJustificatif} className="ligne-formulaire colonne">
                    <input type="file" onChange={(e) => setFichier(e.target.files[0] || null)} required />
                    <textarea
                        className="champ-texte"
                        rows={2}
                        placeholder="Précision (facultatif)..."
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                    />
                    <button type="submit" className="submit-button" disabled={envoiEnCours}>
                        {envoiEnCours ? "Envoi en cours..." : "Envoyer le justificatif"}
                    </button>
                    {succes && <p style={{ color: "var(--success)", fontSize: 13 }}>{succes}</p>}
                </form>
            </section>

            <section className="box admin-section">
                <h2>Mes justificatifs</h2>
                {justificatifs.length === 0 && <p className="texte-discret">Aucun justificatif envoyé.</p>}
                {justificatifs.map((j) => (
                    <div key={j.id} className="ligne-liste">
                        <div>
                            <div className="texte-discret">{new Date(j.date_soumission).toLocaleDateString("fr-FR")}</div>
                            {j.commentaire && <div>{j.commentaire}</div>}
                        </div>
                        <span className={"tag-statut " + (j.statut === "valide" ? "present" : j.statut === "refuse" ? "absent" : "retard")}>
                            {LIBELLES_STATUT[j.statut]}
                        </span>
                    </div>
                ))}
            </section>
        </div>
    );
}