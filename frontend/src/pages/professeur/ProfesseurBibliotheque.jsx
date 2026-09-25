import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function ProfesseurBibliotheque() {
    const [publications, setPublications] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [matiereId, setMatiereId] = useState("");
    const [typeContenu, setTypeContenu] = useState("texte");
    const [texte, setTexte] = useState("");
    const [fichier, setFichier] = useState(null);
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
            if (texte) donnees.append("texte", texte);
            donnees.append("matiereId", matiereId);
            donnees.append("dureeExpiration", dureeExpiration);
            if (fichier) donnees.append("fichier", fichier);

            const resultat = await apiFetch("/publications/professeur", { method: "POST", body: donnees });
            setTexte("");
            setFichier(null);
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
                        <select value={typeContenu} onChange={(e) => { setTypeContenu(e.target.value); setFichier(null); }}>
                            <option value="texte">Texte</option>
                            <option value="pdf">PDF</option>
                            <option value="image">Image</option>
                        </select>
                        {typeContenu === "texte" ? (
                            <textarea className="champ-texte" rows={3} placeholder="Contenu du cours..." value={texte} onChange={(e) => setTexte(e.target.value)} />
                        ) : (
                            <>
                                <input type="file" accept={typeContenu === "pdf" ? "application/pdf" : "image/*"} onChange={(e) => setFichier(e.target.files[0] || null)} />
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

            <section className="box admin-section">
                <h2>Mes publications</h2>
                {chargement && <p className="texte-discret">Chargement...</p>}
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
                        </div>
                        <button className="bouton-petit danger" onClick={() => supprimer(p.id)} style={{ marginTop: 6, alignSelf: "flex-start" }}>Supprimer</button>
                    </div>
                ))}
            </section>
        </div>
    );
}