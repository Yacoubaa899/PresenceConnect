import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

const LIBELLES_STATUT = { active: "Active", utilisee: "Utilisée", expiree: "Expirée" };

export default function AdminCleAccesPage() {
    const navigate = useNavigate();
    const [cles, setCles] = useState([]);
    const [dureeCle, setDureeCle] = useState("24");
    const [derniereCle, setDerniereCle] = useState(null);

    const [ancienneCle, setAncienneCle] = useState("");
    const [nouvelleCle, setNouvelleCle] = useState("");
    const [succesAdmin, setSuccesAdmin] = useState(null);
    const [erreurAdmin, setErreurAdmin] = useState(null);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setCles(await apiFetch("/administration/cles-professeur"));
    }

    async function genererCleProf(e) {
        e.preventDefault();
        const resultat = await apiFetch("/administration/cles-professeur", {
            method: "POST",
            body: { dureeHeures: Number(dureeCle) },
        });
        setDerniereCle(resultat);
        charger();
    }

    async function changerCleAdmin(e) {
        e.preventDefault();
        setErreurAdmin(null);
        setSuccesAdmin(null);
        try {
            await apiFetch("/auth/administration/cle-acces", {
                method: "PUT",
                body: { ancienneCle, nouvelleCle },
            });
            setSuccesAdmin("Clé d'accès mise à jour.");
            setAncienneCle("");
            setNouvelleCle("");
        } catch (e) {
            setErreurAdmin(e.message);
        }
    }

    return (
        <div>
            <div className="sous-page-entete">
                <button onClick={() => navigate(-1)}><span className="icone">chevron_left</span></button>
                <h1>Clé d'accès</h1>
            </div>

            <div className="sous-page-contenu">
                <div className="sous-page-presentation">
                    <div className="sous-page-presentation-icone" style={{ background: "#14b8a6" }}>
                        <span className="icone">vpn_key</span>
                    </div>
                    <div>
                        <strong>Clé d'accès</strong>
                        <span>Générez et gérez les clés d'accès des professeurs.</span>
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>
                        Générer une clé professeur
                    </h2>
                    <form onSubmit={genererCleProf} className="ligne-formulaire">
                        <select value={dureeCle} onChange={(e) => setDureeCle(e.target.value)}>
                            <option value="24">Valable 24h</option>
                            <option value="48">Valable 48h</option>
                            <option value="168">Valable 7 jours</option>
                        </select>
                        <button type="submit" className="submit-button" style={{ width: "auto" }}>Générer</button>
                    </form>
                    {derniereCle && (
                        <p className="texte-succes" style={{ marginTop: 8 }}>
                            Clé générée : <strong>{derniereCle.cle}</strong> — à transmettre au professeur.
                        </p>
                    )}
                </div>

                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>
                        Clés générées
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {cles.map((c) => (
                            <div key={c.id} className="ligne-liste">
                                <div>
                                    <strong>{c.professeur_nom ? `${c.professeur_prenom} ${c.professeur_nom}` : "Non utilisée"}</strong>
                                    <div className="texte-discret">Générée le {new Date(c.date_creation).toLocaleDateString("fr-FR")}</div>
                                </div>
                                <span className={"tag-statut " + (c.statut === "active" ? "present" : c.statut === "expiree" ? "absent" : "retard")}>
                                    {LIBELLES_STATUT[c.statut]}
                                </span>
                            </div>
                        ))}
                        {cles.length === 0 && <p className="texte-discret" style={{ textAlign: "center" }}>Aucune clé générée pour l'instant.</p>}
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--primary-navy)", margin: "4px 0 8px" }}>
                        Changer ma clé d'accès administration
                    </h2>
                    <form onSubmit={changerCleAdmin} className="ligne-formulaire colonne">
                        <input type="password" placeholder="Clé actuelle" value={ancienneCle} onChange={(e) => setAncienneCle(e.target.value)} required />
                        <input type="password" placeholder="Nouvelle clé" value={nouvelleCle} onChange={(e) => setNouvelleCle(e.target.value)} required />
                        <button type="submit" className="submit-button">Mettre à jour</button>
                        {succesAdmin && <p style={{ color: "var(--success)", fontSize: 12.5 }}>{succesAdmin}</p>}
                        {erreurAdmin && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{erreurAdmin}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}