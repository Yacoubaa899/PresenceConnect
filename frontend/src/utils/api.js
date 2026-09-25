const API_BASE_URL = "http://localhost:4000/api";

// Centralise les appels au backend : ajoute automatiquement le token
// de connexion, et lève une erreur lisible si la réponse échoue.
export async function apiFetch(chemin, options = {}) {
    const token = localStorage.getItem("presenceconnect_token");
    const envoiFichier = options.body instanceof FormData;

    const reponse = await fetch(`${API_BASE_URL}${chemin}`, {
        ...options,
        headers: {
            // Pour un envoi de fichier, on laisse le navigateur fixer lui-même
            // le Content-Type (avec la "boundary" nécessaire au multipart).
            ...(envoiFichier ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        body: envoiFichier ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    });

    const data = await reponse.json().catch(() => null);

    if (!reponse.ok) {
        throw new Error(data?.erreur || `Erreur ${reponse.status}`);
    }
    return data;
}

export function getUtilisateurConnecte() {
    const brut = localStorage.getItem("presenceconnect_utilisateur");
    return brut ? JSON.parse(brut) : null;
}

export function deconnecter() {
    localStorage.removeItem("presenceconnect_token");
    localStorage.removeItem("presenceconnect_utilisateur");
}

// Télécharge un fichier depuis une route protégée (le navigateur ne peut
// pas envoyer le token via un simple lien <a href>, donc on passe par fetch).
export async function apiTelecharger(chemin, nomFichier) {
    const token = localStorage.getItem("presenceconnect_token");
    const reponse = await fetch(`${API_BASE_URL}${chemin}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!reponse.ok) throw new Error("Le téléchargement a échoué.");

    const blob = await reponse.blob();
    const url = window.URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    lien.click();
    window.URL.revokeObjectURL(url);
}