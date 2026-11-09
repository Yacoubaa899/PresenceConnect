import { useState } from "react";

function tempsRelatif(dateTexte) {
    const date = new Date(dateTexte);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `il y a ${heures}h`;
    const jours = Math.floor(heures / 24);
    if (jours < 7) return `il y a ${jours}j`;
    return date.toLocaleDateString("fr-FR");
}

function infosAuteur(p) {
    if (p.admin_nom) {
        return { nom: `${p.admin_prenom} ${p.admin_nom}`, role: "Administration", initiales: `${p.admin_prenom?.[0] || ""}${p.admin_nom?.[0] || ""}` };
    }
    if (p.prof_nom) {
        return {
            nom: `${p.prof_prenom} ${p.prof_nom}`,
            role: p.matiere_nom ? `Professeur de ${p.matiere_nom}` : "Professeur",
            initiales: `${p.prof_prenom?.[0] || ""}${p.prof_nom?.[0] || ""}`,
        };
    }
    return { nom: "Établissement", role: "", initiales: "PC" };
}

export default function CarteActualite({ publication, action }) {
    const [deplie, setDeplie] = useState(false);
    const auteur = infosAuteur(publication);
    const url = (chemin) => `http://localhost:4000${chemin}`;

    // ------------------------------------------------------------
    // Style "post d'auteur" : contenu en texte seul, sans fichier.
    // ------------------------------------------------------------
    if (publication.type_contenu === "texte") {
        return (
            <div className="carte-post">
                <div className="carte-post-entete">
                    <div className="carte-post-avatar">{auteur.initiales}</div>
                    <div>
                        <strong>{auteur.nom}</strong>
                        <div className="texte-discret">
                            {auteur.role}{auteur.role && " · "}{tempsRelatif(publication.date_publication)}
                        </div>
                    </div>
                </div>
                <div className="carte-post-separateur" />
                <p className="carte-post-texte">{publication.texte}</p>
                {action && <div className="carte-post-action">{action}</div>}
            </div>
        );
    }

    // ------------------------------------------------------------
    // Style "actualité" : image, ou PDF avec couverture (photo fournie,
    // ou visuel par défaut si aucune photo de couverture n'a été ajoutée).
    // ------------------------------------------------------------
    const image = publication.type_contenu === "image" ? publication.fichier : publication.photo_couverture;

    return (
        <div className="carte-actualite">
            {image ? (
                <img src={url(image)} alt="" className="carte-actualite-image" />
            ) : (
                <div className="carte-actualite-image carte-actualite-pdf-defaut">
                    <span className="icone">picture_as_pdf</span>
                </div>
            )}

            <div className="carte-actualite-corps">
                <h3>{publication.titre || (publication.type_contenu === "pdf" ? "Document PDF" : "Publication")}</h3>

                <div className="carte-actualite-meta">
                    <span className="icone" style={{ fontSize: 15 }}>calendar_today</span>
                    {new Date(publication.date_publication).toLocaleDateString("fr-FR")}
                    <span style={{ margin: "0 4px" }}>·</span>
                    Auteur : {auteur.nom}
                </div>

                {deplie && publication.texte && <p className="carte-actualite-texte">{publication.texte}</p>}
                {deplie && publication.type_contenu === "pdf" && publication.fichier && (
                    <a href={url(publication.fichier)} target="_blank" rel="noreferrer" className="lien-fichier">
                        <span className="icone" style={{ fontSize: 15 }}>picture_as_pdf</span> Ouvrir le PDF
                    </a>
                )}

                <div className="carte-actualite-pied">
                    <button className="bouton-pilule" onClick={() => setDeplie((v) => !v)}>
                        {deplie ? "Réduire" : "Lire plus"}
                    </button>
                    {action}
                </div>
            </div>
        </div>
    );
}