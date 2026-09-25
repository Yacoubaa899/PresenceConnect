import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function ProfilEtudiantModal({ etudiantId, afficherValidation, onFermer, onDecision }) {
    const [etudiant, setEtudiant] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [message, setMessage] = useState("");
    const [envoiMessage, setEnvoiMessage] = useState(false);
    const [messageEnvoye, setMessageEnvoye] = useState(false);

    useEffect(() => {
        apiFetch(`/administration/etudiants/${etudiantId}`)
            .then(setEtudiant)
            .catch((e) => setErreur(e.message))
            .finally(() => setChargement(false));
    }, [etudiantId]);

    async function envoyerMessage(e) {
        e.preventDefault();
        if (!message.trim()) return;
        setEnvoiMessage(true);
        try {
            await apiFetch(`/administration/etudiants/${etudiantId}/message`, {
                method: "POST",
                body: { contenu: message },
            });
            setMessage("");
            setMessageEnvoye(true);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoiMessage(false);
        }
    }

    return (
        <div className="modal-fond" onClick={onFermer}>
            <div className="modal-panneau" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fermer" onClick={onFermer}>
                    <span className="icone">close</span>
                </button>

                {chargement && <p className="texte-discret">Chargement du profil...</p>}
                {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

                {etudiant && (
                    <>
                        <h2 className="modal-titre">{etudiant.prenom} {etudiant.nom}</h2>
                        <p className="texte-discret">{etudiant.filiere_nom} — {etudiant.classe_nom}</p>

                        <div className="fiche-info">
                            <div><span>Numéro étudiant</span><strong>{etudiant.numero_etudiant}</strong></div>
                            <div><span>E-mail</span><strong>{etudiant.email}</strong></div>
                            <div><span>Téléphone</span><strong>{etudiant.telephone}</strong></div>
                            <div><span>Téléphone d'un parent</span><strong>{etudiant.telephone_parent}</strong></div>
                            <div><span>Quartier</span><strong>{etudiant.quartier || "—"}</strong></div>
                            <div><span>Sexe</span><strong>{etudiant.sexe === "M" ? "Masculin" : "Féminin"}</strong></div>
                            <div><span>Âge</span><strong>{etudiant.age} ans</strong></div>
                            <div><span>Statut</span><strong>{etudiant.actif ? "Actif" : "Suspendu"}</strong></div>
                        </div>

                        {afficherValidation && (
                            <div className="actions-ligne" style={{ marginTop: 14 }}>
                                <button className="bouton-petit succes" onClick={() => onDecision("valider", etudiant.id)}>Valider le compte</button>
                                <button className="bouton-petit danger" onClick={() => onDecision("refuser", etudiant.id)}>Refuser</button>
                            </div>
                        )}

                        <form onSubmit={envoyerMessage} className="ligne-formulaire colonne" style={{ marginTop: 16 }}>
                            <label className="texte-discret" style={{ marginBottom: -6 }}>Envoyer un message</label>
                            <textarea
                                className="champ-texte"
                                rows={3}
                                placeholder="Votre message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button type="submit" className="submit-button" disabled={envoiMessage}>
                                {envoiMessage ? "Envoi..." : "Envoyer le message"}
                            </button>
                            {messageEnvoye && <p style={{ color: "var(--success)", fontSize: 13 }}>Message envoyé.</p>}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}