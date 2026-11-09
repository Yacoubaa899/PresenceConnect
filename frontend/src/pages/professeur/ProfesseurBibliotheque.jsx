import { useEffect, useState } from "react";
import { apiFetch, getUtilisateurConnecte } from "../../utils/api.js";
import CarteActualite from "../../components/CarteActualite.jsx";

export default function ProfesseurBibliotheque() {
    const utilisateur = getUtilisateurConnecte();
    const [publications, setPublications] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [matiereId, setMatiereId] = useState("");
    const [typeContenu, setTypeContenu] = useState("texte");
    const [titre, setTitre] = useState("");
    const [texte, setTexte] = useState("");
    const [fichier, setFichier] = useState(null);
    const [photoCouverture, setPhotoCouverture] = useState(null);
    const [dureeExpiration, setDureeExpiration] = useState("illimitee");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [succes, setSucces] = useState(null);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setChargement(true);
        try {
            const [pubs, mesMatieres] = await Promise.all([
                apiFetch("/publications/bibliotheque"),
                apiFetch("/sessions/mes-matieres"),
            ]);
            setPublications(pubs);
            setMatieres(mesMatieres);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function publier(e) {
        e.preventDefault();
        if (!matiereId) return;
        if (typeContenu === "texte" && !texte.trim()) return;
        if (typeContenu !== "texte" && !fichier) return;

        setErreur(null);
        setSucces(null);
        setEnvoiEnCours(true);

        try {
            const donnees = new FormData();
            donnees.append("typeContenu", typeContenu);
            if (titre) donnees.append("titre", titre);
            if (texte) donnees.append("texte", texte);
            donnees.append("matiereId", matiereId);
            donnees.append("dureeExpiration", dureeExpiration);
            if (fichier) donnees.append("fichier", fichier);
            if (photoCouverture) donnees.append("photoCouverture", photoCouverture);

            const resultat = await apiFetch("/publications/professeur", { method: "POST", body: donnees });
            setTitre("");
            setTexte("");
            setFichier(null);
            setPhotoCouverture(null);
            setSucces(resultat.message || "Publié.");
            charger();
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoiEnCours(false);
        }
    }

    async function supprimer(id) {
        await apiFetch(`/publications/${id}`, { method: "DELETE" });
        charger();
    }

    return (
        <div className="onglet-contenu">
            <section className="box admin-section">
                <h2>Publier un cours</h2>
                {matieres.length === 0 ? (
                    <p className="texte-discret">Aucune matière ne vous a encore été attribuée.</p>
                ) : (
                    <form onSubmit={publier} className="ligne-formulaire colonne">
                        <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} required>
                            <option value="">Matière...</option>
                            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                        </select>
                        <select value={typeContenu} onChange={(e) => { setTypeContenu(e.target.value); setFichier(null); setPhotoCouverture(null); }}>
                            <option value="texte">Texte</option>
                            <option value="pdf">PDF</option>
                            <option value="image">Image</option>
                        </select>

                        {typeContenu !== "texte" && (
                            <input placeholder="Titre de la publication" value={titre} onChange={(e) => setTitre(e.target.value)} />
                        )}

                        {typeContenu === "texte" ? (
                            <textarea className="champ-texte" rows={3} placeholder="Contenu du cours..." value={texte} onChange={(e) => setTexte(e.target.value)} />
                        ) : (
                            <>
                                <label className="texte-discret">
                                    Fichier ({typeContenu === "pdf" ? "PDF" : "image"})
                                    <input type="file" accept={typeContenu === "pdf" ? "application/pdf" : "image/*"} onChange={(e) => setFichier(e.target.files[0] || null)} style={{ display: "block", marginTop: 4 }} />
                                </label>
                                {typeContenu === "pdf" && (
                                    <label className="texte-discret">
                                        Photo de couverture (facultative — une image par défaut sera utilisée sinon)
                                        <input type="file" accept="image/*" onChange={(e) => setPhotoCouverture(e.target.files[0] || null)} style={{ display: "block", marginTop: 4 }} />
                                    </label>
                                )}
                                <textarea className="champ-texte" rows={2} placeholder="Texte d'accompagnement (facultatif)..." value={texte} onChange={(e) => setTexte(e.target.value)} />
                            </>
                        )}

                        <select value={dureeExpiration} onChange={(e) => setDureeExpiration(e.target.value)}>
                            <option value="illimitee">Durée illimitée</option>
                            <option value="7_jours">7 jours</option>
                            <option value="1_mois">1 mois</option>
                        </select>
                        <button type="submit" className="submit-button" disabled={envoiEnCours}>
                            {envoiEnCours ? "Envoi en cours..." : "Publier"}
                        </button>
                    </form>
                )}
                {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
                {succes && <p style={{ color: "var(--success)", fontSize: 13 }}>{succes}</p>}
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ padding: "0 2px" }}>Bibliothèque</h2>
                {chargement && <p className="texte-discret">Chargement...</p>}
                {!chargement && publications.length === 0 && <p className="texte-discret">Rien pour l'instant.</p>}
                {publications.map((p) => (
                    <CarteActualite
                        key={p.id}
                        publication={p}
                        action={
                            p.auteur_professeur_id === utilisateur?.id ? (
                                <button className="bouton-petit danger" onClick={() => supprimer(p.id)}>Supprimer</button>
                            ) : null
                        }
                    />
                ))}
            </section>
        </div>
    );
}