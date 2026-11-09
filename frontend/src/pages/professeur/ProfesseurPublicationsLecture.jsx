import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";
import CarteActualite from "../../components/CarteActualite.jsx";

const LIBELLES = { info: "Info", planning: "Planning" };

export default function ProfesseurPublicationsLecture({ categorie }) {
    const [publications, setPublications] = useState([]);
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        apiFetch(`/publications/${categorie}`)
            .then(setPublications)
            .finally(() => setChargement(false));
    }, [categorie]);

    return (
        <div className="onglet-contenu">
            <h2 style={{ fontSize: 16, margin: "0 2px" }}>{LIBELLES[categorie]}</h2>
            {chargement && <p className="texte-discret">Chargement...</p>}
            {!chargement && publications.length === 0 && <p className="texte-discret">Rien pour l'instant.</p>}
            {publications.map((p) => <CarteActualite key={p.id} publication={p} />)}
        </div>
    );
}