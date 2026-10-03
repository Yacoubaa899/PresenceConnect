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
    const [voirMotDePasse, setVoirMotDePasse] = useState(false);
    const [voirConfirmation, setVoirConfirmation] = useState(false);
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

    const lienInvalide = !token || !id;

    return (
        <div className="ecran-auth-fixe">
            <div className="entete-courbe">
                <button type="button" className="entete-courbe-retour" onClick={() => navigate("/connexion")}>
                    <span className="icone" style={{ fontSize: 18 }}>chevron_left</span>
                </button>
                <h1>
                    <span style={{ color: "#fff" }}>Présence</span>{" "}
                    <span style={{ color: "#bfe0ff" }}>Connect</span>
                </h1>
            </div>

            <div className="ecran-auth-contenu">
                <div className="ecran-auth-illustration">
                    <span className="icone">lock</span>
                </div>

                <h2>Nouveau mot de passe</h2>

                {lienInvalide ? (
                    <>
                        <p className="sous-titre">Ce lien de réinitialisation est incomplet ou invalide.</p>
                        <Link to="/mot-de-passe-oublie" className="ecran-auth-lien-retour">Refaire une demande</Link>
                    </>
                ) : (
                    <>
                        <p className="sous-titre">Choisissez un nouveau mot de passe pour sécuriser votre compte.</p>

                        <form onSubmit={envoyer} className="ecran-auth-formulaire">
                            <div>
                                <label className="champ-icone-label">Nouveau mot de passe</label>
                                <div className="champ-icone">
                                    <span className="icone">lock</span>
                                    <input
                                        type={voirMotDePasse ? "text" : "password"}
                                        placeholder="Entrez votre nouveau mot de passe"
                                        value={nouveauMotDePasse}
                                        onChange={(e) => setNouveauMotDePasse(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button type="button" className="champ-icone-bouton-oeil" onClick={() => setVoirMotDePasse((v) => !v)}>
                                        <span className="icone" style={{ fontSize: 18 }}>{voirMotDePasse ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="champ-icone-label">Confirmer le mot de passe</label>
                                <div className="champ-icone">
                                    <span className="icone">lock</span>
                                    <input
                                        type={voirConfirmation ? "text" : "password"}
                                        placeholder="Confirmez votre mot de passe"
                                        value={confirmation}
                                        onChange={(e) => setConfirmation(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="champ-icone-bouton-oeil" onClick={() => setVoirConfirmation((v) => !v)}>
                                        <span className="icone" style={{ fontSize: 18 }}>{voirConfirmation ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="bouton-bleu-fleche" disabled={envoi}>
                                {envoi ? "Mise à jour..." : "Réinitialiser le mot de passe"}
                                {!envoi && <span className="icone" style={{ fontSize: 17 }}>arrow_forward</span>}
                            </button>

                            {succes && <p style={{ color: "var(--success)", fontSize: 12.5 }}>{succes}</p>}
                            {erreur && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{erreur}</p>}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}