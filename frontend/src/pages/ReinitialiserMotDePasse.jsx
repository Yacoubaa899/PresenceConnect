import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function ReinitialiserMotDePasse() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const token = params.get("token");
    const id = params.get("id");

    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);

    async function envoyer(e) {
        e.preventDefault();
        setErreur(null);

        if (nouveauMotDePasse !== confirmation) {
            setErreur("Les deux mots de passe ne correspondent pas.");
            return;
        }
        if (!token || !id) {
            setErreur("Lien invalide. Refaites une demande de réinitialisation.");
            return;
        }

        setEnvoi(true);
        try {
            const resultat = await apiFetch("/auth/reinitialiser-mot-de-passe", {
                method: "POST",
                body: { id, token, nouveauMotDePasse },
            });
            setSucces(resultat.message);
            setTimeout(() => navigate("/connexion"), 1500);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    if (!token || !id) {
        return (
            <div className="screen">
                <div className="title-box">Lien invalide</div>
                <p className="texte-discret" style={{ textAlign: "center" }}>
                    Ce lien de réinitialisation est incomplet ou invalide.
                </p>
                <p className="signup-box"><Link to="/mot-de-passe-oublie">Refaire une demande</Link></p>
            </div>
        );
    }

    return (
        <div className="screen">
            <div className="title-box">Nouveau mot de passe</div>
            <form onSubmit={envoyer} className="fields-box box">
                <label>
                    Nouveau mot de passe
                    <input type="password" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} required autoFocus />
                </label>
                <label>
                    Confirmer le mot de passe
                    <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
                </label>
                <button type="submit" className="submit-button" disabled={envoi}>
                    {envoi ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </button>
                {succes && <p style={{ color: "var(--success)", fontSize: 13 }}>{succes}</p>}
                {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
            </form>
        </div>
    );
}