import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Service worker : installation (PWA) et mode hors ligne.
// On l'enregistre après le premier affichage pour ne pas ralentir le
// chargement initial de l'application.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((erreur) => {
            console.error("Échec de l'enregistrement du service worker :", erreur);
        });
    });
}