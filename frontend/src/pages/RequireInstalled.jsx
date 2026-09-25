import { Navigate } from "react-router-dom";

function estInstallee() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

function estEnDeveloppementLocal() {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

// En production, on n'autorise la connexion/inscription que si l'app est
// installée. En développement (localhost), on laisse passer pour pouvoir
// tester facilement, car les navigateurs ne proposent pas toujours
// l'installation sur un serveur de développement.
export default function RequireInstalled({ children }) {
    if (!estInstallee() && !estEnDeveloppementLocal()) {
        return <Navigate to="/" replace />;
    }
    return children;
}