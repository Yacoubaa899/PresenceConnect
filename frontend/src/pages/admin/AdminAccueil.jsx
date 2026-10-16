import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function AdminAccueil() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ eleves: 0, professeurs: 0, absences: 0, cours: 0 });
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        try {
            const [etudiants, professeurs, absences, matieres] = await Promise.all([
                apiFetch("/administration/etudiants"),
                apiFetch("/administration/professeurs"),
                apiFetch("/administration/absences"),
                apiFetch("/structure/matieres"),
            ]);
            setStats({
                eleves: etudiants.length,
                professeurs: professeurs.length,
                absences: absences.length,
                cours: matieres.length,
            });
        } catch {
            // En cas d'échec, on garde les compteurs à 0 plutôt que de bloquer la page.
        } finally {
            setChargement(false);
        }
    }

    return (
        <div className="tableau-bord">
            <section>
                <h2>Vue d'ensemble de l'établissement</h2>
                <div className="stats-grille">
                    <button className="carte-stat stat-eleves" onClick={() => navigate("/admin/eleves")}>
                        <span className="carte-stat-icone"><span className="icone">groups</span></span>
                        <span className="carte-stat-texte"><span>Élèves</span><strong>{chargement ? "…" : stats.eleves}</strong></span>
                    </button>
                    <button className="carte-stat stat-professeurs" onClick={() => navigate("/admin/professeurs")}>
                        <span className="carte-stat-icone"><span className="icone">person</span></span>
                        <span className="carte-stat-texte"><span>Professeurs</span><strong>{chargement ? "…" : stats.professeurs}</strong></span>
                    </button>
                    <button className="carte-stat stat-absences" onClick={() => navigate("/admin/absences")}>
                        <span className="carte-stat-icone"><span className="icone">event_busy</span></span>
                        <span className="carte-stat-texte"><span>Absences</span><strong>{chargement ? "…" : stats.absences}</strong></span>
                    </button>
                    <button className="carte-stat stat-cours" onClick={() => navigate("/admin/structure")}>
                        <span className="carte-stat-icone"><span className="icone">menu_book</span></span>
                        <span className="carte-stat-texte"><span>Cours</span><strong>{chargement ? "…" : stats.cours}</strong></span>
                    </button>
                </div>
            </section>

            <section>
                <h2>Actions rapides</h2>
                <div className="actions-grille">
                    <button className="bouton-action-rapide action-bleu" onClick={() => navigate("/admin/activation-comptes")}>
                        <span className="icone">person_check</span>
                        Activer un compte
                    </button>
                    <button className="bouton-action-rapide action-violet" onClick={() => navigate("/admin/professeurs")}>
                        <span className="icone">assignment</span>
                        Attribuer une matière
                    </button>
                    <button className="bouton-action-rapide action-orange" onClick={() => navigate("/admin/notes")}>
                        <span className="icone">edit_note</span>
                        Attribuer des notes
                    </button>
                    <button className="bouton-action-rapide action-rose" onClick={() => navigate("/admin/justifications")}>
                        <span className="icone">fact_check</span>
                        Gérer les justifications
                    </button>
                    <button className="bouton-action-rapide action-sarcelle" onClick={() => navigate("/admin/cle-acces")}>
                        <span className="icone">vpn_key</span>
                        Clé d'accès
                    </button>
                </div>
            </section>
        </div>
    );
}