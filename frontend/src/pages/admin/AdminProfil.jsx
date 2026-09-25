import { useState } from "react";
import { apiFetch, getUtilisateurConnecte } from "../../utils/api.js";

export default function AdminProfil() {
    const utilisateur = getUtilisateurConnecte();
    const [ancienneCle, setAncienneCle] = useState("");
    const [nouvelleCle, setNouvelleCle] = useState("");
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);
    const [envoi, setEnvoi] = useState(false);

    async function changerCle(e) {
        e.preventDefault();
        setErreur(null);
        setSucces(null);
        setEnvoi(true);
        try {
            await apiFetch("/auth/administration/cle-acces", {
                method: "PUT",
                body: { ancienneCle, nouvelleCle },
            });
            setSucces("Clé d'accès mise à jour.");
            setAncienneCle("");
            setNouvelleCle("");
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="onglet-contenu">
            <section className="box admin-section">
                <h2>Mon profil</h2>
                <p><strong>{utilisateur?.prenom} {utilisateur?.nom}</strong></p>
                <p className="texte-discret">Administration</p>
            </section>

            <section className="box admin-section">
                <h2>Changer ma clé d'accès</h2>
                <form onSubmit={changerCle} className="ligne-formulaire colonne">
                    <input
                        type="password"
                        placeholder="Clé actuelle"
                        value={ancienneCle}
                        onChange={(e) => setAncienneCle(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Nouvelle clé"
                        value={nouvelleCle}
                        onChange={(e) => setNouvelleCle(e.target.value)}
                        required
                    />
                    <button type="submit" className="submit-button" disabled={envoi}>
                        {envoi ? "Mise à jour..." : "Mettre à jour"}
                    </button>
                </form>
                {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
                {succes && <p style={{ color: "var(--success)", fontSize: 13 }}>{succes}</p>}
            </section>
        </div>
    );
}