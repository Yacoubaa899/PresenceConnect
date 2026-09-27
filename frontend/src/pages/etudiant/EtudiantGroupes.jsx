import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

const DESCRIPTION_MAX = 150;

export default function EtudiantGroupes() {
    const [groupes, setGroupes] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [nomGroupe, setNomGroupe] = useState("");
    const [descriptionGroupe, setDescriptionGroupe] = useState("");
    const [photoGroupe, setPhotoGroupe] = useState(null);

    const [groupeOuvert, setGroupeOuvert] = useState(null); // { groupe, membres, estCreateur }
    const [demandesAdhesion, setDemandesAdhesion] = useState([]);
    const [messages, setMessages] = useState([]);
    const [nouveauMessage, setNouveauMessage] = useState("");
    const [reponseA, setReponseA] = useState(null); // { id, auteur, extrait }
    const [fichierMessage, setFichierMessage] = useState(null);
    const [typeFichierMessage, setTypeFichierMessage] = useState(null); // "image" ou "pdf"

    const [rechercheInvite, setRechercheInvite] = useState("");
    const [resultatsInvite, setResultatsInvite] = useState([]);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setChargement(true);
        try {
            const [listeGroupes, mesInvitations] = await Promise.all([
                apiFetch("/groupes"),
                apiFetch("/invitations"),
            ]);
            setGroupes(listeGroupes);
            setInvitations(mesInvitations);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function creerGroupe(e) {
        e.preventDefault();
        if (!nomGroupe.trim()) return;
        try {
            const donnees = new FormData();
            donnees.append("nom", nomGroupe);
            if (descriptionGroupe) donnees.append("description", descriptionGroupe);
            if (photoGroupe) donnees.append("photo", photoGroupe);
            await apiFetch("/groupes", { method: "POST", body: donnees });
            setNomGroupe("");
            setDescriptionGroupe("");
            setPhotoGroupe(null);
            charger();
        } catch (e) {
            setErreur(e.message);
        }
    }

    async function demanderAdhesion(id) {
        try {
            await apiFetch(`/groupes/${id}/demande-adhesion`, { method: "POST" });
            charger();
        } catch (e) {
            setErreur(e.message);
        }
    }

    async function ouvrirGroupe(id) {
        try {
            const data = await apiFetch(`/groupes/${id}`);
            setGroupeOuvert(data);
            setRechercheInvite("");
            setResultatsInvite([]);
            setReponseA(null);
            const msgs = await apiFetch(`/groupes/${id}/messages`);
            setMessages(msgs);
            if (data.estCreateur) {
                const demandes = await apiFetch(`/groupes/${id}/demandes-adhesion`);
                setDemandesAdhesion(demandes);
            } else {
                setDemandesAdhesion([]);
            }
        } catch (e) {
            setErreur(e.message);
        }
    }

    async function traiterDemande(demandeId, decision) {
        await apiFetch(`/groupes/${groupeOuvert.groupe.id}/demandes-adhesion/${demandeId}`, {
            method: "POST",
            body: { decision },
        });
        ouvrirGroupe(groupeOuvert.groupe.id);
    }

    async function rechercherEtudiants(valeur) {
        setRechercheInvite(valeur);
        if (valeur.trim().length < 2) {
            setResultatsInvite([]);
            return;
        }
        const resultats = await apiFetch(
            `/groupes/recherche-etudiants?recherche=${encodeURIComponent(valeur)}&groupeId=${groupeOuvert.groupe.id}`
        );
        setResultatsInvite(resultats);
    }

    async function inviter(etudiantId) {
        await apiFetch(`/groupes/${groupeOuvert.groupe.id}/inviter`, {
            method: "POST",
            body: { etudiantId },
        });
        rechercherEtudiants(rechercheInvite);
    }

    async function repondreInvitation(id, reponse) {
        await apiFetch(`/invitations/${id}/repondre`, { method: "POST", body: { reponse } });
        charger();
    }

    async function envoyerMessage(e) {
        e.preventDefault();
        if (!nouveauMessage.trim() && !fichierMessage) return;

        const donnees = new FormData();
        donnees.append("typeContenu", typeFichierMessage || "texte");
        if (nouveauMessage) donnees.append("contenu", nouveauMessage);
        if (reponseA) donnees.append("reponseA", reponseA.id);
        if (fichierMessage) donnees.append("fichier", fichierMessage);

        await apiFetch(`/groupes/${groupeOuvert.groupe.id}/messages`, { method: "POST", body: donnees });
        setNouveauMessage("");
        setReponseA(null);
        setFichierMessage(null);
        setTypeFichierMessage(null);
        const msgs = await apiFetch(`/groupes/${groupeOuvert.groupe.id}/messages`);
        setMessages(msgs);
    }

    function choisirFichierMessage(type, fichier) {
        if (!fichier) return;
        setTypeFichierMessage(type);
        setFichierMessage(fichier);
    }

    async function quitterGroupe() {
        await apiFetch(`/groupes/${groupeOuvert.groupe.id}/quitter`, { method: "POST" });
        setGroupeOuvert(null);
        charger();
    }

    function initiales(nom, prenom) {
        return `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();
    }

    if (chargement) return <p style={{ padding: 18 }}>Chargement...</p>;

    return (
        <div className="onglet-contenu">
            {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

            {invitations.length > 0 && (
                <section className="box admin-section">
                    <h2>Invitations reçues</h2>
                    {invitations.map((inv) => (
                        <div key={inv.id} className="ligne-liste">
                            <div>
                                <strong>{inv.groupe_nom}</strong>
                                <div className="texte-discret">Invité par {inv.invite_par_prenom} {inv.invite_par_nom}</div>
                            </div>
                            <div className="actions-ligne">
                                <button className="bouton-petit succes" onClick={() => repondreInvitation(inv.id, "acceptee")}>Accepter</button>
                                <button className="bouton-petit danger" onClick={() => repondreInvitation(inv.id, "refusee")}>Refuser</button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            <section className="box admin-section">
                <h2>Créer un groupe</h2>
                <form onSubmit={creerGroupe} className="ligne-formulaire colonne">
                    <input placeholder="Nom du groupe" value={nomGroupe} onChange={(e) => setNomGroupe(e.target.value)} required />
                    <textarea
                        className="champ-texte"
                        rows={2}
                        placeholder="Description (facultatif)"
                        value={descriptionGroupe}
                        maxLength={DESCRIPTION_MAX}
                        onChange={(e) => setDescriptionGroupe(e.target.value)}
                    />
                    <div className="texte-discret" style={{ textAlign: "right", marginTop: -6 }}>
                        {descriptionGroupe.length}/{DESCRIPTION_MAX}
                    </div>
                    <label className="texte-discret">
                        Photo du groupe (facultatif)
                        <input type="file" accept="image/*" onChange={(e) => setPhotoGroupe(e.target.files[0] || null)} style={{ display: "block", marginTop: 4 }} />
                    </label>
                    <button type="submit" className="submit-button">Créer le groupe</button>
                </form>
            </section>

            <section className="box admin-section">
                <h2>Groupes</h2>
                {groupes.length === 0 && <p className="texte-discret">Aucun groupe pour l'instant.</p>}
                {groupes.map((g) => (
                    <div key={g.id} className="groupe-carte">
                        <div
                            className={"groupe-avatar" + (g.estMembre ? " cliquable" : "")}
                            onClick={() => g.estMembre && ouvrirGroupe(g.id)}
                        >
                            {g.photo_groupe ? (
                                <img src={`http://localhost:4000${g.photo_groupe}`} alt="" />
                            ) : (
                                <span>{initiales(g.nom.slice(0, 2), "")}</span>
                            )}
                        </div>
                        <div
                            className={"groupe-texte" + (g.estMembre ? " cliquable" : "")}
                            onClick={() => g.estMembre && ouvrirGroupe(g.id)}
                        >
                            <strong>{g.nom}</strong>
                            {g.description && <div className="texte-discret">{g.description}</div>}
                        </div>
                        {!g.estMembre && (
                            g.demandeEnAttente ? (
                                <span className="tag-attente">Demande envoyée</span>
                            ) : (
                                <button className="bouton-petit succes" onClick={() => demanderAdhesion(g.id)}>Rejoindre</button>
                            )
                        )}
                    </div>
                ))}
            </section>

            {groupeOuvert && (
                <div className="modal-fond" onClick={() => setGroupeOuvert(null)}>
                    <div className="modal-panneau" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-fermer" onClick={() => setGroupeOuvert(null)}>
                            <span className="icone">close</span>
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="groupe-avatar" style={{ width: 56, height: 56 }}>
                                {groupeOuvert.groupe.photo_groupe ? (
                                    <img src={`http://localhost:4000${groupeOuvert.groupe.photo_groupe}`} alt="" />
                                ) : (
                                    <span>{initiales(groupeOuvert.groupe.nom.slice(0, 2), "")}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="modal-titre" style={{ margin: 0 }}>{groupeOuvert.groupe.nom}</h2>
                                {groupeOuvert.groupe.description && <p className="texte-discret" style={{ margin: 0 }}>{groupeOuvert.groupe.description}</p>}
                            </div>
                        </div>

                        <div className="fiche-info" style={{ marginTop: 12 }}>
                            {groupeOuvert.membres.map((m) => (
                                <div key={m.id}><span>{m.prenom} {m.nom}</span></div>
                            ))}
                        </div>

                        {groupeOuvert.estCreateur && demandesAdhesion.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <label className="texte-discret" style={{ display: "block", marginBottom: 6 }}>
                                    Demandes d'adhésion en attente
                                </label>
                                {demandesAdhesion.map((d) => (
                                    <div key={d.id} className="ligne-liste">
                                        <span>{d.prenom} {d.nom}</span>
                                        <div className="actions-ligne">
                                            <button className="bouton-petit succes" onClick={() => traiterDemande(d.id, "acceptee")}>Accepter</button>
                                            <button className="bouton-petit danger" onClick={() => traiterDemande(d.id, "refusee")}>Refuser</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: 16 }}>
                            <label className="texte-discret" style={{ display: "block", marginBottom: 6 }}>Inviter un étudiant</label>
                            <input
                                className="champ-recherche"
                                placeholder="Rechercher par nom..."
                                value={rechercheInvite}
                                onChange={(e) => rechercherEtudiants(e.target.value)}
                            />
                            {resultatsInvite.map((e) => (
                                <div key={e.id} className="ligne-liste">
                                    <span>{e.prenom} {e.nom}</span>
                                    {e.dejaMembre ? (
                                        <span className="texte-discret">Déjà membre</span>
                                    ) : e.dejaInvite ? (
                                        <span className="tag-attente">Déjà invité</span>
                                    ) : (
                                        <button className="bouton-petit succes" onClick={() => inviter(e.id)}>Inviter</button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                            <label className="texte-discret" style={{ display: "block", marginBottom: 8 }}>Discussion</label>
                            <div className="messages-groupe">
                                {messages.length === 0 && <p className="texte-discret">Aucun message pour l'instant.</p>}
                                {messages.map((m) => (
                                    <div key={m.id} className="message-groupe-ligne">
                                        <div className="groupe-avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
                                            {m.auteur_photo ? (
                                                <img src={`http://localhost:4000${m.auteur_photo}`} alt="" />
                                            ) : (
                                                <span>{initiales(m.auteur_nom, m.auteur_prenom)}</span>
                                            )}
                                        </div>
                                        <div className="message-groupe">
                                            {m.reponse_a && (
                                                <div className="message-reponse-a">
                                                    Réponse à {m.reponse_auteur_prenom} {m.reponse_auteur_nom} : «{" "}
                                                    {m.reponse_type_contenu === "texte"
                                                        ? `${m.reponse_contenu?.slice(0, 40)}${m.reponse_contenu?.length > 40 ? "…" : ""}`
                                                        : m.reponse_type_contenu === "image" ? "photo" : "fichier PDF"}
                                                    {" »"}
                                                </div>
                                            )}
                                            <div className="message-auteur">{m.auteur_prenom} {m.auteur_nom}</div>

                                            {m.type_contenu === "image" && (
                                                <img src={`http://localhost:4000${m.fichier}`} alt="" className="message-image" />
                                            )}
                                            {m.type_contenu === "pdf" && (
                                                <a href={`http://localhost:4000${m.fichier}`} target="_blank" rel="noreferrer" className="lien-fichier">
                                                    <span className="icone" style={{ fontSize: 15 }}>picture_as_pdf</span>
                                                    Voir le PDF
                                                </a>
                                            )}
                                            {m.contenu && <div>{m.contenu}</div>}

                                            <button className="lien-discret" style={{ fontSize: 11 }} onClick={() => setReponseA({ id: m.id, auteur: `${m.auteur_prenom} ${m.auteur_nom}` })}>
                                                Répondre
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={envoyerMessage} className="ligne-formulaire" style={{ marginTop: 10 }}>
                                {reponseA && (
                                    <div className="texte-discret" style={{ width: "100%", marginBottom: 4 }}>
                                        Réponse à {reponseA.auteur} — <span className="lien-discret" onClick={() => setReponseA(null)}>annuler</span>
                                    </div>
                                )}

                                {fichierMessage && (
                                    <div className="apercu-fichier-message" style={{ width: "100%" }}>
                                        <span className="icone" style={{ fontSize: 15 }}>
                                            {typeFichierMessage === "image" ? "image" : "picture_as_pdf"}
                                        </span>
                                        <span>{fichierMessage.name}</span>
                                        <button type="button" className="lien-discret" onClick={() => { setFichierMessage(null); setTypeFichierMessage(null); }}>
                                            retirer
                                        </button>
                                    </div>
                                )}

                                <div className="zone-saisie-message">
                                    {!nouveauMessage && !fichierMessage && (
                                        <>
                                            <label className="icone-piece-jointe" title="Envoyer une image">
                                                <span className="icone">image</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => choisirFichierMessage("image", e.target.files[0])}
                                                />
                                            </label>
                                            <label className="icone-piece-jointe" title="Envoyer un PDF">
                                                <span className="icone">attach_file</span>
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => choisirFichierMessage("pdf", e.target.files[0])}
                                                />
                                            </label>
                                        </>
                                    )}
                                    <input
                                        placeholder={fichierMessage ? "Ajouter un texte (facultatif)..." : "Écrire un message..."}
                                        value={nouveauMessage}
                                        onChange={(e) => setNouveauMessage(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="submit-button" style={{ width: "auto" }}>Envoyer</button>
                            </form>
                        </div>

                        <button className="bouton-petit danger" style={{ marginTop: 16 }} onClick={quitterGroupe}>
                            Quitter le groupe
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}