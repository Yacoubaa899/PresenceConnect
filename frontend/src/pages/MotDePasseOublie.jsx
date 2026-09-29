import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function MotDePasseOublie() {
    const [email, setEmail] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState(null);
    const [erreur, setErreur] = useState(null);
    const [lienTest, setLienTest] = useState(null);
    const [infoTest, setInfoTest] = useState(null);

    async function envoyer(e) {
        e.preventDefault();
        setEnvoi(true);
        setErreur(null);
        setMessage(null);
        setLienTest(null);
        setInfoTest(null);
        try {
            const resultat = await apiFetch("/auth/mot-de-passe-oublie", { method: "POST", body: { email } });
            setMessage(resultat.message);
            setLienTest(resultat.devLien || null);
            setInfoTest(resultat.devInfo || null);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="screen">
            <div className="title-box">Mot de passe oublié</div>
            <form onSubmit={envoyer} className="fields-box box">
                <label>
                    Votre e-mail
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                </label>
                <button type="submit" className="submit-button" disabled={envoi}>
                    {envoi ? "Envoi..." : "Recevoir le lien de réinitialisation"}
                </button>
                {message && <p style={{ color: "var(--success)", fontSize: 13 }}>{message}</p>}
                {lienTest && (
                    <p className="texte-discret" style={{ wordBreak: "break-all" }}>
                        Mode test — <a href={lienTest}>ouvrir le lien de réinitialisation</a>
                    </p>
                )}
                {infoTest && <p className="texte-discret">{infoTest}</p>}
                {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
            </form>
            <p className="signup-box"><Link to="/connexion">Retour à la connexion</Link></p>
        </div>
    );
}