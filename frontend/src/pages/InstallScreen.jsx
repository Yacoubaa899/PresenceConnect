import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function isRunningAsInstalledApp() {
    // Standalone display mode = l'app est déjà installée et lancée depuis l'écran d'accueil
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

export default function InstallScreen() {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Si l'app tourne déjà en mode installé, on passe directement à la connexion
        if (isRunningAsInstalledApp()) {
            navigate("/connexion", { replace: true });
            return;
        }

        // Chrome/Android déclenche cet évènement quand l'app est installable
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };

        // Déclenché une fois l'installation confirmée par l'utilisateur
        const handleAppInstalled = () => {
            setInstalled(true);
            navigate("/connexion", { replace: true });
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, [navigate]);

    async function handleInstallClick() {
        if (!deferredPrompt) {
            // Sur iOS/Safari, il n'y a pas d'API d'installation : on ne peut qu'expliquer la marche à suivre.
            alert(
                "Sur iPhone : ouvrez le menu de partage de Safari, puis choisissez « Sur l'écran d'accueil »."
            );
            return;
        }
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
            setInstalled(true);
        }
        setDeferredPrompt(null);
    }

    return (
        <div className="screen install-screen">
            <div className="box title-box">PresenceConnect</div>

            <div className="box desc-box">
                <p>
                    PresenceConnect réunit la gestion des présences, les emplois du
                    temps, la bibliothèque de cours et les informations de
                    l'établissement dans une seule application, pour les étudiants,
                    les professeurs, l'administration et les parents.
                </p>
            </div>

            <p className="plain-text">
                Installer l'application pour s'inscrire ou se connecter
            </p>

            <button className="box install-button" onClick={handleInstallClick}>
                {installed ? "Application installée" : "Installer"}
            </button>
        </div>
    );
}