import { getUtilisateurConnecte } from "../../utils/api.js";

export default function EtudiantProfil() {
    const utilisateur = getUtilisateurConnecte();

    return (
        <div className="onglet-contenu">
            <section className="box admin-section">
                <h2>Mon profil</h2>
                <p><strong>{utilisateur?.prenom} {utilisateur?.nom}</strong></p>
                <p className="texte-discret">Étudiant</p>
            </section>
        </div>
    );
}