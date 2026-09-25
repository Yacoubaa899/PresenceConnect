import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function ProfesseurAccueil() {
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [matieres, setMatieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [matiereChoisie, setMatiereChoisie] = useState("");
    const [classeChoisie, setClasseChoisie] = useState("");

    const [sessionId, setSessionId] = useState(null);
    const [session, setSession] = useState(null);
    const [etudiants, setEtudiants] = useState([]);

    const [recapitulatif, setRecapitulatif] = useState(null);
    const [envoye, setEnvoye] = useState(false);

    const [modalMotDePasse, setModalMotDePasse] = useState(null); // etudiantId
    const [motDePasseSaisi, setMotDePasseSaisi] = useState("");

    useEffect(() => {
        initialiser();
    }, []);

    async function initialiser() {
        setChargement(true);
        try {
            const [mesMatieres, listeClasses, sessionOuverte] = await Promise.all([
                apiFetch("/sessions/mes-matieres"),
                apiFetch("/structure/classes"),
                apiFetch("/sessions/ma-session-ouverte"),
            ]);
            setMatieres(mesMatieres);
            setClasses(listeClasses);
            if (sessionOuverte) {
                setSessionId(sessionOuverte.id);
                await chargerSession(sessionOuverte.id);
            }
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function chargerSession(id) {
        const data = await apiFetch(`/sessions/${id}`);
        setSession(data.session);
        setEtudiants(data.etudiants);
    }

    async function demarrerSession(e) {
        e.preventDefault();
        if (!matiereChoisie || !classeChoisie) return;
        setErreur(null);
        try {
            const resultat = await apiFetch("/sessions/demarrer", {
                method: "POST",
                body: { matiereId: matiereChoisie, classeId: classeChoisie },
            });
            setSessionId(resultat.id);
            await chargerSession(resultat.id);
        } catch (e) {
            setErreur(e.message);
        }
    }

    async function marquerManuel(etudiantId, statut) {
        await apiFetch(`/sessions/${sessionId}/marquer-manuel`, {
            method: "POST",
            body: { etudiantId, statut },
        });
        chargerSession(sessionId);
    }

    async function validerParMotDePasse(e) {
        e.preventDefault();
        try {
            await apiFetch(`/sessions/${sessionId}/valider-mot-de-passe`, {
                method: "POST",
                body: { etudiantId: modalMotDePasse, motDePasse: motDePasseSaisi },
            });
            setModalMotDePasse(null);
            setMotDePasseSaisi("");
            chargerSession(sessionId);
        } catch (e) {
            setErreur(e.message);
        }
    }

    async function terminerSession() {
        const resultat = await apiFetch(`/sessions/${sessionId}/cloturer`, { method: "POST" });
        setRecapitulatif(resultat.recapitulatif);
        chargerSession(sessionId);
    }

    async function envoyerListe() {
        await apiFetch(`/sessions/${sessionId}/envoyer`, { method: "POST" });
        setEnvoye(true);
    }

    function reinitialiser() {
        setSessionId(null);
        setSession(null);
        setEtudiants([]);
        setRecapitulatif(null);
        setEnvoye(false);
    }

    const classesFiltrees = classes; // toute classe est proposée ; affinable plus tard par filière

    if (chargement) return <p style={{ padding: 18 }}>Chargement...</p>;

    return (
        <div className="onglet-contenu">
            {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

            {!sessionId && (
                <section className="box admin-section">
                    <h2>Démarrer un cours</h2>
                    {matieres.length === 0 ? (
                        <p className="texte-discret">Aucune matière ne vous a encore été attribuée par l'administration.</p>
                    ) : (
                        <form onSubmit={demarrerSession} className="ligne-formulaire colonne">
                            <select value={matiereChoisie} onChange={(e) => setMatiereChoisie(e.target.value)} required>
                                <option value="">Matière...</option>
                                {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                            </select>
                            <select value={classeChoisie} onChange={(e) => setClasseChoisie(e.target.value)} required>
                                <option value="">Classe...</option>
                                {classesFiltrees.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.annee})</option>)}
                            </select>
                            <button type="submit" className="submit-button">Démarrer le cours</button>
                        </form>
                    )}
                </section>
            )}

            {sessionId && session && (
                <>
                    <section className="box admin-section">
                        <h2>Session en cours</h2>
                        <p className="texte-discret">
                            Démarrée à {new Date(session.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            {session.statut === "cloturee" && " — clôturée"}
                        </p>

                        {etudiants.map((e) => (
                            <div key={e.id} className="ligne-liste">
                                <div>
                                    <strong>{e.prenom} {e.nom}</strong>
                                </div>
                                <div className="actions-ligne">
                                    {e.statut && <span className={"tag-statut " + e.statut}>{e.statut}</span>}
                                    {session.statut === "ouverte" && (
                                        <>
                                            <button className="bouton-petit succes" onClick={() => marquerManuel(e.id, "present")}>Présent</button>
                                            <button className="bouton-petit" onClick={() => marquerManuel(e.id, "retard")}>Retard</button>
                                            <button className="bouton-petit danger" onClick={() => marquerManuel(e.id, "absent")}>Absent</button>
                                            <button className="bouton-petit" onClick={() => setModalMotDePasse(e.id)}>
                                                <span className="icone" style={{ fontSize: 14 }}>password</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </section>

                    {session.statut === "ouverte" && (
                        <button className="submit-button" onClick={terminerSession}>Terminer la session</button>
                    )}

                    {session.statut === "cloturee" && !envoye && (
                        <section className="box admin-section">
                            <h2>Envoyer la fiche</h2>
                            {recapitulatif && (
                                <p className="texte-discret">
                                    {recapitulatif.map((r) => `${r.total} ${r.statut}`).join(" · ")}
                                </p>
                            )}
                            <button className="submit-button" onClick={envoyerListe}>Envoyer la liste</button>
                        </section>
                    )}

                    {envoye && (
                        <>
                            <p className="texte-succes">Fiche envoyée à l'administration.</p>
                            <button className="submit-button" onClick={reinitialiser}>Démarrer un nouveau cours</button>
                        </>
                    )}
                </>
            )}

            {modalMotDePasse && (
                <div className="modal-fond" onClick={() => setModalMotDePasse(null)}>
                    <div className="modal-panneau" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-fermer" onClick={() => setModalMotDePasse(null)}>
                            <span className="icone">close</span>
                        </button>
                        <h2 className="modal-titre">Confirmer la présence</h2>
                        <p className="texte-discret">L'étudiant saisit son mot de passe ci-dessous ; confirmez qu'il s'agit bien de lui.</p>
                        <form onSubmit={validerParMotDePasse} className="fields-box" style={{ marginTop: 12 }}>
                            <label>
                                Mot de passe de l'étudiant
                                <input
                                    type="password"
                                    value={motDePasseSaisi}
                                    onChange={(e) => setMotDePasseSaisi(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </label>
                            <button type="submit" className="submit-button">Valider la présence</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}