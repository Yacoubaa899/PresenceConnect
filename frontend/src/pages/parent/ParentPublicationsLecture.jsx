import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

const LIBELLES = { info: "Info", planning: "Planning" };

export default function ParentPublicationsLecture({ categorie }) {
    const [publications, setPublications] = useState([]);
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        apiFetch(`/publications/${categorie}`)
            .then(setPublications)
            .finally(() => setChargement(false));
    }, [categorie]);

    return (
        <div className="onglet-contenu">
            <section className="box admin-section">
                <h2>{LIBELLES[categorie]}</h2>
                {chargement && <p className="texte-discret">Chargement...</p>}
                {!chargement && publications.length === 0 && <p className="texte-discret">Rien pour l'instant.</p>}
                {publications.map((p) => (
                    <div key={p.id} className="ligne-liste" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <div>
                            {p.texte && <div>{p.texte}</div>}
                            {p.fichier && p.type_contenu === "image" && (
                                <img src={`http://localhost:4000${p.fichier}`} alt="" className="apercu-image" />
                            )}
                            {p.fichier && p.type_contenu === "pdf" && (
                                <a href={`http://localhost:4000${p.fichier}`} target="_blank" rel="noreferrer" className="lien-fichier">
                                    <span className="icone" style={{ fontSize: 15 }}>picture_as_pdf</span>
                                    Voir le fichier
                                </a>
                            )}
                            <div className="texte-discret">
                                Publié le {new Date(p.date_publication).toLocaleDateString("fr-FR")}
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}