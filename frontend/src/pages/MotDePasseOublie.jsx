import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function MotDePasseOublie() {
    const navigate = useNavigate();
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
        <div className="ecran-auth-fixe">
            <div className="entete-courbe">
                <button type="button" className="entete-courbe-retour" onClick={() => navigate("/connexion")}>
                    <span className="icone" style={{ fontSize: 18 }}>chevron_left</span> Retour à la connexion
                </button>
                <h1>Mot de passe oublié</h1>
            </div>

            <div className="ecran-auth-contenu">
                <div className="ecran-auth-illustration">
                    <span className="icone">mark_email_read</span>
                </div>

                <h2>Mot de passe oublié ?</h2>
                <p className="sous-titre">
                    Pas de souci ! Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                <form onSubmit={envoyer} className="ecran-auth-formulaire">
                    <div>
                        <label className="champ-icone-label">Adresse e-mail</label>
                        <div className="champ-icone">
                            <span className="icone">mail</span>
                            <input
                                type="email"
                                placeholder="exemple@domaine.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <button type="submit" className="bouton-bleu-fleche" disabled={envoi}>
                        {envoi ? "Envoi..." : "Envoyer le lien"}
                        {!envoi && <span className="icone" style={{ fontSize: 17 }}>arrow_forward</span>}
                    </button>

                    {message && <p style={{ color: "var(--success)", fontSize: 12.5 }}>{message}</p>}
                    {lienTest && (
                        <p className="texte-discret" style={{ wordBreak: "break-all", fontSize: 11.5 }}>
                            Mode test — <a href={lienTest}>ouvrir le lien de réinitialisation</a>
                        </p>
                    )}
                    {infoTest && <p className="texte-discret" style={{ fontSize: 11.5 }}>{infoTest}</p>}
                    {erreur && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{erreur}</p>}
                </form>

                <Link to="/connexion" className="ecran-auth-lien-retour">Retour à la connexion</Link>
            </div>

            <div className="ecran-auth-pied">
                <span className="icone">shield</span> Votre sécurité est notre priorité
            </div>
        </div>
    );
}