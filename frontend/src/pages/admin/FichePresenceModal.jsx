import { useEffect, useState } from "react";
import { apiFetch, apiTelecharger } from "../../utils/api.js";

const LIBELLES_STATUT = { present: "Présent", retard: "Retard", absent: "Absent" };

export default function FichePresenceModal({ ficheId, onFermer }) {
    const [donnees, setDonnees] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [telechargement, setTelechargement] = useState(false);

    useEffect(() => {
        apiFetch(`/administration/fiches/${ficheId}`)
            .then(setDonnees)
            .catch((e) => setErreur(e.message))
            .finally(() => setChargement(false));
    }, [ficheId]);

    async function telecharger() {
        setTelechargement(true);
        try {
            await apiTelecharger(`/administration/fiches/${ficheId}/pdf`, `fiche-presence-${ficheId}.pdf`);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setTelechargement(false);
        }
    }

    return (
        <div className="modal-fond" onClick={onFermer}>
            <div className="modal-panneau" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fermer" onClick={onFermer}>
                    <span className="icone">close</span>
                </button>

                {chargement && <p className="texte-discret">Chargement...</p>}
                {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

                {donnees && (
                    <>
                        <h2 className="modal-titre">{donnees.session.matiere_nom}</h2>
                        <p className="texte-discret">
                            {donnees.session.filiere_nom} — {donnees.session.classe_nom} — {donnees.session.prof_prenom} {donnees.session.prof_nom}
                        </p>
                        <p className="texte-discret">
                            {new Date(donnees.session.date_debut).toLocaleDateString("fr-FR")} à{" "}
                            {new Date(donnees.session.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>

                        <div className="fiche-info" style={{ marginTop: 14 }}>
                            {donnees.etudiants.map((e, i) => (
                                <div key={i}>
                                    <span>{e.prenom} {e.nom}</span>
                                    <strong className={"texte-statut " + e.statut}>{LIBELLES_STATUT[e.statut] || e.statut}</strong>
                                </div>
                            ))}
                        </div>

                        <button className="submit-button" style={{ marginTop: 16 }} onClick={telecharger} disabled={telechargement}>
                            {telechargement ? "Génération du PDF..." : "Télécharger en PDF"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}