import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ROLES = [
    {
        id: "student",
        nom: "Étudiant",
        description: "Accédez à vos cours, notes, absences et plus encore.",
        icone: "school",
        classe: "carte-etudiant",
    },
    {
        id: "teacher",
        nom: "Professeur",
        description: "Gérez vos cours, vos élèves, vos notes et vos informations.",
        icone: "badge",
        classe: "carte-professeur",
    },
    {
        id: "admin",
        nom: "Administration",
        description: "Gérez l'établissement, les élèves, les professeurs et les publications.",
        icone: "groups",
        classe: "carte-administration",
    },
    {
        id: "parent",
        nom: "Parent",
        description: "Suivez la scolarité de votre enfant et restez informé.",
        icone: "family_restroom",
        classe: "carte-parent",
    },
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
    const [etape, setEtape] = useState("choix"); // "choix" ou "champs"
    const [role, setRole] = useState(null);
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

    function choisirRole(idRole) {
        setRole(idRole);
        setEtape("champs");
        setErreur(null);
    }

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

    // ------------------------------------------------------------
    // ÉTAPE 1 : choix du rôle
    // ------------------------------------------------------------
    if (etape === "choix") {
        return (
            <div className="ecran-choix-role">
                <div className="choix-role-entete">
                    <h1>Choisissez votre espace</h1>
                    <p>Connectez-vous en tant que :</p>
                </div>

                <div className="choix-role-liste">
                    {ROLES.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            className={"carte-role " + r.classe}
                            onClick={() => choisirRole(r.id)}
                        >
                            <span className="carte-role-icone">
                                <span className="icone">{r.icone}</span>
                            </span>
                            <span className="carte-role-texte">
                                <strong>{r.nom}</strong>
                                <span>{r.description}</span>
                            </span>
                            <span className="icone carte-role-chevron">chevron_right</span>
                        </button>
                    ))}
                </div>

                <div className="choix-role-pied">
                    <span className="icone choix-role-pied-icone">menu_book</span>
                    <p>Un bon suivi aujourd'hui<br />pour un meilleur avenir demain.</p>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------
    // ÉTAPE 2 : champs de connexion, selon le rôle choisi
    // ------------------------------------------------------------
    const roleActuel = ROLES.find((r) => r.id === role);

    return (
        <div className="screen login-screen">
            <button type="button" className="lien-retour" onClick={() => setEtape("choix")}>
                <span className="icone" style={{ fontSize: 16 }}>chevron_left</span> Changer d'espace
            </button>

            <div className="box title-box">{roleActuel?.nom}</div>

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
                                autoFocus
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
                            autoFocus
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
                                autoFocus
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