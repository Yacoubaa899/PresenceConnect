import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ROLES = [
    { id: "student", label: "Étud" },
    { id: "admin", label: "Admin" },
    { id: "teacher", label: "Prof" },
    { id: "parent", label: "Parents" },
];

// Adresse de ton backend Node.js en développement local.
const API_BASE_URL = "http://localhost:4000/api/auth";

// Fait correspondre chaque rôle à sa route de connexion et à ce qu'il faut envoyer.
function buildLoginRequest(role, form) {
    if (role === "student") {
        return {
            url: `${API_BASE_URL}/connexion/etudiant`,
            body: { email: form.email, motDePasse: form.password },
        };
    }
    if (role === "teacher") {
        return {
            url: `${API_BASE_URL}/connexion/professeur`,
            body: { cleAcces: form.accessKey },
        };
    }
    if (role === "admin") {
        return {
            url: `${API_BASE_URL}/connexion/administration`,
            body: { cleAcces: form.accessKey },
        };
    }
    // parent
    return {
        url: `${API_BASE_URL}/connexion/parent`,
        body: { telephone: form.phone, codeParent: form.parentCode },
    };
}

export default function LoginScreen() {
    const navigate = useNavigate();
    const [role, setRole] = useState("student");
    const [form, setForm] = useState({
        email: "",
        password: "",
        accessKey: "",
        phone: "",
        parentCode: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [succes, setSucces] = useState(null);

    function updateField(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setErreur(null);
        setSucces(null);
        setSubmitting(true);

        try {
            const { url, body } = buildLoginRequest(role, form);
            const reponse = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await reponse.json();

            if (!reponse.ok) {
                setErreur(data.erreur || "Connexion refusée.");
                return;
            }

            // Le token doit être conservé pour les prochaines requêtes (ex. localStorage).
            localStorage.setItem("presenceconnect_token", data.token);
            localStorage.setItem("presenceconnect_utilisateur", JSON.stringify(data.utilisateur));
            setSucces(`Connecté avec succès en tant que ${data.utilisateur.role}.`);

            const destinations = {
                etudiant: "/etudiant",
                professeur: "/professeur",
                administration: "/admin",
                parent: "/parent",
            };
            setTimeout(() => navigate(destinations[data.utilisateur.role] || "/"), 500);
        } catch (err) {
            setErreur("Impossible de joindre le serveur. Vérifie qu'il tourne bien (npm run dev).");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="screen login-screen">
            <div className="box title-box">presenceConnect</div>

            <div className="box role-tabs">
                {ROLES.map((r) => (
                    <button
                        key={r.id}
                        type="button"
                        className={"role-tab" + (role === r.id ? " selected" : "")}
                        onClick={() => setRole(r.id)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            <form className="box fields-box" onSubmit={handleSubmit}>
                {role === "student" && (
                    <>
                        <label>
                            Adresse e-mail
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Mot de passe
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                required
                            />
                        </label>
                    </>
                )}

                {(role === "teacher" || role === "admin") && (
                    <label>
                        Clé d'accès {role === "teacher" ? "professeur" : "administration"}
                        <input
                            type="text"
                            value={form.accessKey}
                            onChange={(e) => updateField("accessKey", e.target.value)}
                            required
                        />
                    </label>
                )}

                {role === "parent" && (
                    <>
                        <label>
                            Numéro de téléphone
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Code parent (4 chiffres)
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={form.parentCode}
                                onChange={(e) => updateField("parentCode", e.target.value)}
                                required
                            />
                        </label>
                    </>
                )}

                <button type="submit" className="submit-button" disabled={submitting}>
                    {submitting ? "Connexion..." : "Se connecter"}
                </button>

                {erreur && <p style={{ color: "var(--danger)", fontSize: 13, margin: "8px 0 0" }}>{erreur}</p>}
                {succes && <p style={{ color: "var(--success)", fontSize: 13, margin: "8px 0 0" }}>{succes}</p>}
            </form>

            <div className="box signup-box">
                {role === "student" && (
                    <>
                        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
                        <br />
                        <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
                    </>
                )}
                {role === "teacher" && (
                    <>Première connexion ? <Link to="/activation-professeur">Activer mon compte avec ma clé</Link></>
                )}
                {(role === "admin" || role === "parent") && (
                    <span>Les accès de ce rôle sont fournis par l'administration.</span>
                )}
            </div>
        </div>
    );
}