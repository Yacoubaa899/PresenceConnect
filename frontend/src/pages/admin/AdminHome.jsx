import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getUtilisateurConnecte, deconnecter } from "../../utils/api.js";

export default function AdminHome() {
    const navigate = useNavigate();
    const utilisateur = getUtilisateurConnecte();

    const [comptesEnAttente, setComptesEnAttente] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [etudiants, setEtudiants] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [parametres, setParametres] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);

    const [nouvelleFiliere, setNouvelleFiliere] = useState("");
    const [nouvelleClasse, setNouvelleClasse] = useState({ nom: "", filiereId: "", annee: "" });
    const [nouvelleMatiere, setNouvelleMatiere] = useState({ nom: "", filiereId: "" });
    const [dureeCle, setDureeCle] = useState("24");
    const [derniereCle, setDerniereCle] = useState(null);

    useEffect(() => {
        if (!utilisateur || utilisateur.role !== "administration") {
            navigate("/connexion");
            return;
        }
        chargerDonnees();
    }, []);

    async function chargerDonnees() {
        setChargement(true);
        setErreur(null);
        try {
            const [attente, listeFilieres, listeClasses, listeMatieres, listeEtudiants, params] = await Promise.all([
                apiFetch("/administration/comptes-en-attente"),
                apiFetch("/structure/filieres"),
                apiFetch("/structure/classes"),
                apiFetch("/structure/matieres"),
                apiFetch("/administration/etudiants"),
                apiFetch("/administration/parametres"),
            ]);
            setComptesEnAttente(attente);
            setFilieres(listeFilieres);
            setClasses(listeClasses);
            setMatieres(listeMatieres);
            setEtudiants(listeEtudiants);
            setParametres(params);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function validerCompte(id) {
        await apiFetch(`/administration/comptes-en-attente/${id}/valider`, { method: "POST" });
        chargerDonnees();
    }

    async function refuserCompte(id) {
        await apiFetch(`/administration/comptes-en-attente/${id}/refuser`, { method: "POST" });
        chargerDonnees();
    }

    async function creerFiliere(e) {
        e.preventDefault();
        if (!nouvelleFiliere.trim()) return;
        await apiFetch("/structure/filieres", { method: "POST", body: { nom: nouvelleFiliere } });
        setNouvelleFiliere("");
        chargerDonnees();
    }

    async function creerClasse(e) {
        e.preventDefault();
        const { nom, filiereId, annee } = nouvelleClasse;
        if (!nom.trim() || !filiereId || !annee.trim()) return;
        await apiFetch("/structure/classes", { method: "POST", body: { nom, filiereId, annee } });
        setNouvelleClasse({ nom: "", filiereId: "", annee: "" });
        chargerDonnees();
    }

    async function creerMatiere(e) {
        e.preventDefault();
        const { nom, filiereId } = nouvelleMatiere;
        if (!nom.trim() || !filiereId) return;
        await apiFetch("/structure/matieres", { method: "POST", body: { nom, filiereId } });
        setNouvelleMatiere({ nom: "", filiereId: "" });
        chargerDonnees();
    }

    async function genererCleProf(e) {
        e.preventDefault();
        const resultat = await apiFetch("/administration/cles-professeur", {
            method: "POST",
            body: { dureeHeures: Number(dureeCle) },
        });
        setDerniereCle(resultat);
    }

    async function rechercherEtudiants(valeur) {
        setRecherche(valeur);
        const resultat = await apiFetch(`/administration/etudiants?recherche=${encodeURIComponent(valeur)}`);
        setEtudiants(resultat);
    }

    async function basculerControleCompte() {
        const nouvelleValeur = !parametres.controle_compte_actif;
        await apiFetch("/administration/parametres/controle-compte", {
            method: "PUT",
            body: { actif: nouvelleValeur },
        });
        setParametres({ ...parametres, controle_compte_actif: nouvelleValeur });
    }

    function seDeconnecter() {
        deconnecter();
        navigate("/connexion");
    }

    if (chargement) return <div className="screen"><p>Chargement...</p></div>;

    return (
        <div className="screen admin-screen">
            <div className="admin-header">
                <div className="admin-header-title">PresenceConnect — Administration</div>
                <button className="lien-discret" onClick={seDeconnecter}>Déconnexion</button>
            </div>

            {erreur && <p style={{ color: "var(--danger)" }}>{erreur}</p>}

            {/* Réglage du contrôle de compte */}
            {parametres && (
                <section className="box admin-section">
                    <h2>Contrôle de compte</h2>
                    <div className="ligne-reglage">
                        <span className="texte-discret">
                            {parametres.controle_compte_actif
                                ? "Les nouvelles inscriptions attendent une validation."
                                : "Les nouvelles inscriptions sont automatiquement actives."}
                        </span>
                        <button
                            className={"interrupteur" + (parametres.controle_compte_actif ? " actif" : "")}
                            onClick={basculerControleCompte}
                        >
                            <span className="interrupteur-bouton" />
                        </button>
                    </div>
                </section>
            )}

            {/* Comptes en attente de validation */}
            <section className="box admin-section">
                <h2>Comptes en attente ({comptesEnAttente.length})</h2>
                {comptesEnAttente.length === 0 && <p className="texte-discret">Aucun compte en attente.</p>}
                {comptesEnAttente.map((c) => (
                    <div key={c.id} className="ligne-liste">
                        <div>
                            <strong>{c.prenom} {c.nom}</strong>
                            <div className="texte-discret">{c.filiere_nom} — {c.classe_nom} — n° {c.numero_etudiant}</div>
                        </div>
                        <div className="actions-ligne">
                            <button className="bouton-petit succes" onClick={() => validerCompte(c.id)}>Valider</button>
                            <button className="bouton-petit danger" onClick={() => refuserCompte(c.id)}>Refuser</button>
                        </div>
                    </div>
                ))}
            </section>

            {/* Génération de clé professeur */}
            <section className="box admin-section">
                <h2>Générer une clé professeur</h2>
                <form onSubmit={genererCleProf} className="ligne-formulaire">
                    <select value={dureeCle} onChange={(e) => setDureeCle(e.target.value)}>
                        <option value="24">Valable 24h</option>
                        <option value="48">Valable 48h</option>
                        <option value="168">Valable 7 jours</option>
                    </select>
                    <button type="submit" className="submit-button" style={{ width: "auto" }}>Générer</button>
                </form>
                {derniereCle && (
                    <p className="texte-succes">
                        Clé générée : <strong>{derniereCle.cle}</strong> — à transmettre au professeur (elle ne sera plus affichée).
                    </p>
                )}
            </section>

            {/* Filières */}
            <section className="box admin-section">
                <h2>Filières ({filieres.length})</h2>
                <ul className="liste-simple">
                    {filieres.map((f) => <li key={f.id}>{f.nom}</li>)}
                </ul>
                <form onSubmit={creerFiliere} className="ligne-formulaire">
                    <input placeholder="Nom de la filière" value={nouvelleFiliere} onChange={(e) => setNouvelleFiliere(e.target.value)} />
                    <button type="submit" className="submit-button" style={{ width: "auto" }}>Ajouter</button>
                </form>
            </section>

            {/* Classes */}
            <section className="box admin-section">
                <h2>Classes ({classes.length})</h2>
                <ul className="liste-simple">
                    {classes.map((c) => <li key={c.id}>{c.nom} — {c.filiere_nom} ({c.annee})</li>)}
                </ul>
                <form onSubmit={creerClasse} className="ligne-formulaire colonne">
                    <input placeholder="Nom de la classe" value={nouvelleClasse.nom}
                        onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, nom: e.target.value })} />
                    <select value={nouvelleClasse.filiereId}
                        onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, filiereId: e.target.value })}>
                        <option value="">Filière...</option>
                        {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                    <input placeholder="Année (ex: 2026-2027)" value={nouvelleClasse.annee}
                        onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, annee: e.target.value })} />
                    <button type="submit" className="submit-button">Ajouter la classe</button>
                </form>
            </section>

            {/* Matières */}
            <section className="box admin-section">
                <h2>Matières ({matieres.length})</h2>
                <ul className="liste-simple">
                    {matieres.map((m) => <li key={m.id}>{m.nom} — {m.filiere_nom}</li>)}
                </ul>
                <form onSubmit={creerMatiere} className="ligne-formulaire colonne">
                    <input placeholder="Nom de la matière" value={nouvelleMatiere.nom}
                        onChange={(e) => setNouvelleMatiere({ ...nouvelleMatiere, nom: e.target.value })} />
                    <select value={nouvelleMatiere.filiereId}
                        onChange={(e) => setNouvelleMatiere({ ...nouvelleMatiere, filiereId: e.target.value })}>
                        <option value="">Filière...</option>
                        {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                    <button type="submit" className="submit-button">Ajouter la matière</button>
                </form>
            </section>
            {/* Liste et recherche des étudiants */}
            <section className="box admin-section">
                <h2>Étudiants ({etudiants.length})</h2>
                <input
                    className="champ-recherche"
                    placeholder="Rechercher par nom ou filière..."
                    value={recherche}
                    onChange={(e) => rechercherEtudiants(e.target.value)}
                />
                <ul className="liste-simple">
                    {etudiants.map((e) => (
                        <li key={e.id}>
                            {e.prenom} {e.nom} — {e.filiere_nom} / {e.classe_nom}
                            {!e.actif && <span className="etiquette-suspendu"> (suspendu)</span>}
                        </li>
                    ))}
                    {etudiants.length === 0 && <li className="texte-discret">Aucun résultat.</li>}
                </ul>
            </section>
        </div>
    );
}