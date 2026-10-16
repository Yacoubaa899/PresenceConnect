import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function AdminStructure() {
    const navigate = useNavigate();
    const [filieres, setFilieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [matieres, setMatieres] = useState([]);

    const [nouvelleFiliere, setNouvelleFiliere] = useState("");
    const [nouvelleClasse, setNouvelleClasse] = useState({ nom: "", filiereId: "", annee: "" });
    const [nouvelleMatiere, setNouvelleMatiere] = useState({ nom: "", filiereId: "" });

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        const [f, c, m] = await Promise.all([
            apiFetch("/structure/filieres"), apiFetch("/structure/classes"), apiFetch("/structure/matieres"),
        ]);
        setFilieres(f); setClasses(c); setMatieres(m);
    }

    async function creerFiliere(e) {
        e.preventDefault();
        if (!nouvelleFiliere.trim()) return;
        await apiFetch("/structure/filieres", { method: "POST", body: { nom: nouvelleFiliere } });
        setNouvelleFiliere("");
        charger();
    }

    async function creerClasse(e) {
        e.preventDefault();
        const { nom, filiereId, annee } = nouvelleClasse;
        if (!nom.trim() || !filiereId || !annee.trim()) return;
        await apiFetch("/structure/classes", { method: "POST", body: { nom, filiereId, annee } });
        setNouvelleClasse({ nom: "", filiereId: "", annee: "" });
        charger();
    }

    async function creerMatiere(e) {
        e.preventDefault();
        const { nom, filiereId } = nouvelleMatiere;
        if (!nom.trim() || !filiereId) return;
        await apiFetch("/structure/matieres", { method: "POST", body: { nom, filiereId } });
        setNouvelleMatiere({ nom: "", filiereId: "" });
        charger();
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Filières, classes et matières</h1>
            </div>

            <div className="sous-page-contenu">
                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>Filières ({filieres.length})</h2>
                    <ul className="liste-simple">{filieres.map((f) => <li key={f.id}>{f.nom}</li>)}</ul>
                    <form onSubmit={creerFiliere} className="ligne-formulaire">
                        <input placeholder="Nom de la filière" value={nouvelleFiliere} onChange={(e) => setNouvelleFiliere(e.target.value)} />
                        <button type="submit" className="submit-button" style={{ width: "auto" }}>Ajouter</button>
                    </form>
                </div>

                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>Classes ({classes.length})</h2>
                    <ul className="liste-simple">{classes.map((c) => <li key={c.id}>{c.nom} — {c.filiere_nom} ({c.annee})</li>)}</ul>
                    <form onSubmit={creerClasse} className="ligne-formulaire colonne">
                        <input placeholder="Nom de la classe" value={nouvelleClasse.nom} onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, nom: e.target.value })} />
                        <select value={nouvelleClasse.filiereId} onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, filiereId: e.target.value })}>
                            <option value="">Filière...</option>
                            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                        <input placeholder="Année (ex: 2026-2027)" value={nouvelleClasse.annee} onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, annee: e.target.value })} />
                        <button type="submit" className="submit-button">Ajouter la classe</button>
                    </form>
                </div>

                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>Matières ({matieres.length})</h2>
                    <ul className="liste-simple">{matieres.map((m) => <li key={m.id}>{m.nom} — {m.filiere_nom}</li>)}</ul>
                    <form onSubmit={creerMatiere} className="ligne-formulaire colonne">
                        <input placeholder="Nom de la matière" value={nouvelleMatiere.nom} onChange={(e) => setNouvelleMatiere({ ...nouvelleMatiere, nom: e.target.value })} />
                        <select value={nouvelleMatiere.filiereId} onChange={(e) => setNouvelleMatiere({ ...nouvelleMatiere, filiereId: e.target.value })}>
                            <option value="">Filière...</option>
                            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                        <button type="submit" className="submit-button">Ajouter la matière</button>
                    </form>
                </div>
            </div>
        </div>
    );
}