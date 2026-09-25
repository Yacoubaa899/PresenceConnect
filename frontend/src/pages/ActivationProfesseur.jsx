import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function ActivationProfesseur() {
    const navigate = useNavigate();
    const [etape, setEtape] = useState(1); // 1 = vérifier la clé, 2 = compléter le profil

    const [cle, setCle] = useState("");
    const [filieres, setFilieres] = useState([]);

    const [form, setForm] = useState({
        nom: "", prenom: "", filiereId: "", licence: "", nombreHeures: "", nouvelleCleAcces: "",
    });

    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        apiFetch("/structure/filieres").then(setFilieres).catch(() => { });
    }, []);

    async function verifierCle(e) {
        e.preventDefault();
        setErreur(null);
        setEnvoi(true);
        try {
            await apiFetch("/professeur/verifier-cle", { method: "POST", body: { cle } });
            setEtape(2);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    function majChamp(champ, valeur) {
        setForm((prev) => ({ ...prev, [champ]: valeur }));
    }

    async function activerCompte(e) {
        e.preventDefault();
        setErreur(null);
        setEnvoi(true);
        try {
            const resultat = await apiFetch("/professeur/activer-compte", {
                method: "POST",
                body: { cle, ...form },
            });
            localStorage.setItem("presenceconnect_token", resultat.token);
            localStorage.setItem("presenceconnect_utilisateur", JSON.stringify(resultat.utilisateur));
            navigate("/professeur");
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="screen">
            <div className="title-box">Activer mon compte professeur</div>

            {etape === 1 && (
                <form onSubmit={verifierCle} className="fields-box box">
                    <label>
                        Clé transmise par l'administration
                        <input value={cle} onChange={(e) => setCle(e.target.value)} required autoFocus />
                    </label>
                    <button type="submit" className="submit-button" disabled={envoi}>
                        {envoi ? "Vérification..." : "Vérifier la clé"}
                    </button>
                    {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
                </form>
            )}

            {etape === 2 && (
                <form onSubmit={activerCompte} className="fields-box box">
                    <label>
                        Nom
                        <input value={form.nom} onChange={(e) => majChamp("nom", e.target.value)} required />
                    </label>
                    <label>
                        Prénom
                        <input value={form.prenom} onChange={(e) => majChamp("prenom", e.target.value)} required />
                    </label>
                    <label>
                        Filière
                        <select value={form.filiereId} onChange={(e) => majChamp("filiereId", e.target.value)} required>
                            <option value="">Choisir une filière...</option>
                            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                    </label>
                    <label>
                        Licence / diplôme
                        <input value={form.licence} onChange={(e) => majChamp("licence", e.target.value)} />
                    </label>
                    <label>
                        Nombre d'heures à dispenser
                        <input type="number" min="0" value={form.nombreHeures} onChange={(e) => majChamp("nombreHeures", e.target.value)} />
                    </label>
                    <label>
                        Choisissez votre clé d'accès permanente
                        <input
                            type="password"
                            value={form.nouvelleCleAcces}
                            onChange={(e) => majChamp("nouvelleCleAcces", e.target.value)}
                            required
                        />
                    </label>

                    <button type="submit" className="submit-button" disabled={envoi}>
                        {envoi ? "Activation..." : "Activer mon compte"}
                    </button>
                    {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
                </form>
            )}

            <p className="signup-box">
                <Link to="/connexion">Retour à la connexion</Link>
            </p>
        </div>
    );
}