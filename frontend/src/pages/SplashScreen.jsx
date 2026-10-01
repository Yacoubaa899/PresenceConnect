import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUtilisateurConnecte } from "../utils/api.js";

const DUREE_AFFICHAGE_MS = 2500;

const DESTINATIONS_PAR_ROLE = {
    etudiant: "/etudiant",
    professeur: "/professeur",
    administration: "/admin",
    parent: "/parent",
};

export default function SplashScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        const minuteur = setTimeout(() => {
            const utilisateur = getUtilisateurConnecte();
            const token = localStorage.getItem("presenceconnect_token");

            if (utilisateur && token) {
                navigate(DESTINATIONS_PAR_ROLE[utilisateur.role] || "/connexion", { replace: true });
            } else {
                navigate("/accueil-installation", { replace: true });
            }
        }, DUREE_AFFICHAGE_MS);

        return () => clearTimeout(minuteur);
    }, [navigate]);

    return (
        <div className="ecran-demarrage">
            <img src="/splash.png" alt="PresenceConnect" className="ecran-demarrage-image" />
        </div>
    );
}