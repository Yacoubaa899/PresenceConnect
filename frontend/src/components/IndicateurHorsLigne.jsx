import { useEffect, useState } from "react";

export default function IndicateurHorsLigne() {
    const [horsLigne, setHorsLigne] = useState(!navigator.onLine);

    useEffect(() => {
        const surConnexion = () => setHorsLigne(false);
        const surDeconnexion = () => setHorsLigne(true);
        window.addEventListener("online", surConnexion);
        window.addEventListener("offline", surDeconnexion);
        return () => {
            window.removeEventListener("online", surConnexion);
            window.removeEventListener("offline", surDeconnexion);
        };
    }, []);

    if (!horsLigne) return null;

    return (
        <div className="bandeau-hors-ligne">
            Hors connexion — vous consultez les données déjà enregistrées sur cet appareil.
        </div>
    );
}