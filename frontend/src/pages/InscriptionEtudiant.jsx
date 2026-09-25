import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

export default function InscriptionEtudiant() {
    const navigate = useNavigate();

    const [filieres, setFilieres] = useState([]);
    const [classes, setClasses] = useState([]);

    const [form, setForm] = useState({
        nom: "", prenom: "", numeroEtudiant: "", email: "", motDePasse: "",
        telephone: "", quartier: "", telephoneParent: "", sexe: "M", age: "",
        filiereId: "", classeId: "",
    });

    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);

    useEffect(() => {
        apiFetch("/structure/filieres").then(setFilieres).catch(() => { });
        apiFetch("/structure/classes").then(setClasses).catch(() => { });
    }, []);

    function majChamp(champ, valeur) {
        setForm((prev) => ({ ...prev, [champ]: valeur }));
    }

    const classesDeLaFiliere = classes.filter((c) => String(c.filiere_id) === String(form.filiereId));

    async function envoyerFormulaire(e) {
        e.preventDefault();
        setErreur(null);
        setSucces(null);
        setEnvoi(true);

        try {
            const resultat = await apiFetch("/auth/inscription", { method: "POST", body: form });
            setSucces(resultat.message);
            if (resultat.compteValide) {
                setTimeout(() => navigate("/connexion"), 1500);
            }
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="screen">
            <div className="title-box">
                Créer un compte étudiant
            </div>

            <form onSubmit={envoyerFormulaire} className="fields-box box">
                <label>
                    Nom
                    <input value={form.nom} onChange={(e) => majChamp("nom", e.target.value)} required />
                </label>
                <label>
                    Prénom
                    <input value={form.prenom} onChange={(e) => majChamp("prenom", e.target.value)} required />
                </label>
                <label>
                    Numéro d'étudiant
                    <input value={form.numeroEtudiant} onChange={(e) => majChamp("numeroEtudiant", e.target.value)} required />
                </label>
                <label>
                    E-mail
                    <input type="email" value={form.email} onChange={(e) => majChamp("email", e.target.value)} required />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={form.motDePasse} onChange={(e) => majChamp("motDePasse", e.target.value)} required />
                </label>
                <label>
                    Téléphone
                    <input value={form.telephone} onChange={(e) => majChamp("telephone", e.target.value)} required />
                </label>
                <label>
                    Quartier
                    <input value={form.quartier} onChange={(e) => majChamp("quartier", e.target.value)} />
                </label>
                <label>
                    Téléphone d'un parent
                    <input value={form.telephoneParent} onChange={(e) => majChamp("telephoneParent", e.target.value)} required />
                </label>
                <label>
                    Sexe
                    <select value={form.sexe} onChange={(e) => majChamp("sexe", e.target.value)}>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </label>
                <label>
                    Âge
                    <input type="number" min="10" max="80" value={form.age} onChange={(e) => majChamp("age", e.target.value)} required />
                </label>
                <label>
                    Filière
                    <select value={form.filiereId} onChange={(e) => majChamp("filiereId", e.target.value)} required>
                        <option value="">Choisir une filière...</option>
                        {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                </label>
                <label>
                    Classe
                    <select value={form.classeId} onChange={(e) => majChamp("classeId", e.target.value)} required disabled={!form.filiereId}>
                        <option value="">{form.filiereId ? "Choisir une classe..." : "Choisissez d'abord une filière"}</option>
                        {classesDeLaFiliere.map((c) => <option key={c.id} value={c.id}>{c.nom} ({c.annee})</option>)}
                    </select>
                </label>

                <button type="submit" className="submit-button" disabled={envoi}>
                    {envoi ? "Inscription..." : "Inscription"}
                </button>

                {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}
                {succes && <p style={{ color: "var(--success)", fontSize: 13 }}>{succes}</p>}
            </form>

            <p className="signup-box">
                Déjà un compte ? <Link to="/connexion">Se connecter</Link>
            </p>
        </div>
    );
}