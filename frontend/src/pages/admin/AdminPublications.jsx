import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

const LIBELLES = {
    info: "Info",
    planning: "Planning",
    bibliotheque: "Bibliothèque",
};

export default function AdminPublications({ categorie }) {
    const [publications, setPublications] = useState([]);
    const [programmees, setProgrammees] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [typeContenu, setTypeContenu] = useState("texte");
    const [texte, setTexte] = useState("");
    const [dureeExpiration, setDureeExpiration] = useState("illimitee");
    const [estProgrammee, setEstProgrammee] = useState(false);
    const [dateProgrammee, setDateProgrammee] = useState("");
    const [fichier, setFichier] = useState(null);

    const [enEdition, setEnEdition] = useState(null); // id de la publication en cours de modification
    const [editionTexte, setEditionTexte] = useState("");
    const [editionDate, setEditionDate] = useState("");

    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [succes, setSucces] = useState(null);

    useEffect(() => {
        chargerTout();
    }, [categorie]);

    async function chargerTout() {
        setChargement(true);
        setErreur(null);
        try {
            const [actives, enAttente] = await Promise.all([
                apiFetch(`/publications/${categorie}`),
                apiFetch(`/publications/programmees/${categorie}`),
            ]);
            setPublications(actives);
            setProgrammees(enAttente);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function publier(e) {
        e.preventDefault();
        if (typeContenu === "texte" && !texte.trim()) return;
        if (typeContenu !== "texte" && !fichier) return;

        setErreur(null);
        setSucces(null);
        setEnvoiEnCours(true);

        const donnees = new FormData();
        donnees.append("categorie", categorie);
        donnees.append("typeContenu", typeContenu);
        if (texte) donnees.append("texte", texte);
        donnees.append("estProgrammee", estProgrammee);
        if (estProgrammee) donnees.append("dateProgrammee", dateProgrammee);
        donnees.append("dureeExpiration", dureeExpiration);
        if (fichier) donnees.append("fichier", fichier);

        try {
            const resultat = await apiFetch("/publications/admin", { method: "POST", body: donnees });
            setTexte("");
            setFichier(null);
            setEstProgrammee(false);
            setDateProgrammee("");
            setSucces(resultat.message);
            chargerTout();
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function supprimer(id) {
        await apiFetch(`/publications/${id}`, { method: "DELETE" });
        chargerTout();
    }

    function commencerEdition(p) {
        setEnEdition(p.id);
        setEditionTexte(p.texte || "");
        // datetime-local a besoin du format "AAAA-MM-JJTHH:mm"
        setEditionDate(new Date(p.date_programmee).toISOString().slice(0, 16));
    }

    async function enregistrerEdition(id) {
        await apiFetch(`/publications/${id}`, {
            method: "PUT",
            body: { texte: editionTexte, dateProgrammee: editionDate },
        });
        setEnEdition(null);
        chargerTout();
    }

    return (
        <div className="onglet-contenu">
            <section className="box admin-section">
                <h2>Publier dans {LIBELLES[categorie]}</h2>
                <form onSubmit={publier} className="ligne-formulaire colonne">
                    <select value={typeContenu} onChange={(e) => { setTypeContenu(e.target.value); setFichier(null); }}>
                        <option value="texte">Texte</option>
                        <option value="image">Image</option>
                        <option value="pdf">PDF</option>
                    </select>

                    {typeContenu === "texte" && (
                        <textarea
                            className="champ-texte"
                            placeholder="Contenu du message..."
                            value={texte}
                            onChange={(e) => setTexte(e.target.value)}
                            rows={3}
                        />
                    )}

                    {typeContenu !== "texte" && (
                        <>
                            <input
                                type="file"
                                accept={typeContenu === "pdf" ? "application/pdf" : "image/*"}
                                onChange={(e) => setFichier(e.target.files[0] || null)}
                            />
                            <textarea
                                className="champ-texte"
                                placeholder="Texte d'accompagnement (facultatif)..."
                                value={texte}
                                onChange={(e) => setTexte(e.target.value)}
                                rows={2}
                            />
                        </>
                    )}

                    <select value={dureeExpiration} onChange={(e) => setDureeExpiration(e.target.value)}>
                        <option value="illimitee">Durée illimitée</option>
                        <option value="1_jour">1 jour</option>
                        <option value="2_jours">2 jours</option>
                        <option value="7_jours">7 jours</option>
                        <option value="1_mois">1 mois</option>
                    </select>

                    <label className="ligne-case">
                        <input type="checkbox" checked={estProgrammee} onChange={(e) => setEstProgrammee(e.target.checked)} />
                        Programmer plutôt que publier maintenant
                    </label>

                    {estProgrammee && (
                        <input
                            type="datetime-local"
                            value={dateProgrammee}
                            onChange={(e) => setDateProgrammee(e.target.value)}
                        />
                    )}

                    <button type="submit" className="submit-button" disabled={envoiEnCours}>
                        {envoiEnCours ? "Envoi en cours..." : estProgrammee ? "Programmer" : "Publier"}
                    </button>
                    {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
                    {succes && <p style={{ color: "var(--success)", fontSize: 13 }}>{succes}</p>}
                </form>
            </section>

            {programmees.length > 0 && (
                <section className="box admin-section">
                    <h2>En attente de publication ({programmees.length})</h2>
                    {programmees.map((p) => (
                        <div key={p.id} className="ligne-liste" style={{ flexDirection: "column", alignItems: "stretch" }}>
                            {enEdition === p.id ? (
                                <div className="fields-box" style={{ gap: 8 }}>
                                    <textarea className="champ-texte" rows={2} value={editionTexte} onChange={(e) => setEditionTexte(e.target.value)} />
                                    <input type="datetime-local" value={editionDate} onChange={(e) => setEditionDate(e.target.value)} />
                                    <div className="actions-ligne">
                                        <button className="bouton-petit succes" onClick={() => enregistrerEdition(p.id)}>Enregistrer</button>
                                        <button className="bouton-petit" onClick={() => setEnEdition(null)}>Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>{p.texte || `[${p.type_contenu}]`}</div>
                                    <div className="texte-discret">
                                        Publication prévue le {new Date(p.date_programmee).toLocaleDateString("fr-FR")} à{" "}
                                        {new Date(p.date_programmee).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        <span className="tag-attente"> En attente</span>
                                    </div>
                                    <div className="actions-ligne" style={{ marginTop: 6 }}>
                                        <button className="bouton-petit" onClick={() => commencerEdition(p)}>Modifier</button>
                                        <button className="bouton-petit danger" onClick={() => supprimer(p.id)}>Supprimer</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </section>
            )}

            <section className="box admin-section">
                <h2>Publications actives</h2>
                {chargement && <p className="texte-discret">Chargement...</p>}
                {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}
                {!chargement && publications.length === 0 && <p className="texte-discret">Aucune publication pour l'instant.</p>}
                {publications.map((p) => (
                    <div key={p.id} className="ligne-liste" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <div>
                            {p.texte && <div>{p.texte}</div>}

                            {p.fichier && p.type_contenu === "image" && (
                                <img src={`http://localhost:4000${p.fichier}`} alt="" className="apercu-image" />
                            )}

                            {p.fichier && p.type_contenu === "pdf" && (
                                <a href={`http://localhost:4000${p.fichier}`} target="_blank" rel="noreferrer" className="lien-fichier">
                                    <span className="icone" style={{ fontSize: 15 }}>picture_as_pdf</span>
                                    Voir le fichier
                                </a>
                            )}

                            <div className="texte-discret">
                                Publié le {new Date(p.date_publication).toLocaleDateString("fr-FR")}
                                {p.date_expiration && ` — expire le ${new Date(p.date_expiration).toLocaleDateString("fr-FR")}`}
                            </div>
                        </div>
                        <div className="actions-ligne" style={{ marginTop: 6 }}>
                            <button className="bouton-petit danger" onClick={() => supprimer(p.id)}>Supprimer</button>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}