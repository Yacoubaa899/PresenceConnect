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

const API_BASE_URL = "http://localhost:4000/api/auth";

function buildLoginRequest(role, form) {
    if (role === "student") {
        return {
            url: `${API_BASE_URL}/connexion/etudiant`,
            body: { email: form.email, motDePasse: form.password },
        };
    }
    if (role === "teacher") {
        return { url: `${API_BASE_URL}/connexion/professeur`, body: { cleAcces: form.accessKey } };
    }
    if (role === "admin") {
        return { url: `${API_BASE_URL}/connexion/administration`, body: { cleAcces: form.accessKey } };
    }
    return {
        url: `${API_BASE_URL}/connexion/parent`,
        body: { telephone: form.phone, codeParent: form.parentCode },
    };
}

export default function LoginScreen() {
    const navigate = useNavigate();
    const [etape, setEtape] = useState("choix");
    const [role, setRole] = useState(null);
    const [form, setForm] = useState({ email: "", password: "", accessKey: "", phone: "", parentCode: "" });
    const [voirMotDePasse, setVoirMotDePasse] = useState(false);
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
                        <button key={r.id} type="button" className={"carte-role " + r.classe} onClick={() => choisirRole(r.id)}>
                            <span className="carte-role-icone"><span className="icone">{r.icone}</span></span>
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
    return (
        <div className="ecran-auth-fixe" style={{ background: "#fff" }}>
            <div className="ecran-auth-contenu" style={{ paddingTop: "clamp(20px, 5vh, 40px)" }}>
                <button type="button" className="lien-retour" style={{ alignSelf: "flex-start", marginBottom: 6 }} onClick={() => setEtape("choix")}>
                    <span className="icone" style={{ fontSize: 16 }}>chevron_left</span> Changer d'espace
                </button>

                <img src="/icon-192.png" alt="" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 10 }} />
                <h2 style={{ marginBottom: 0 }}>Présence Connect</h2>
                <p className="sous-titre" style={{ marginBottom: "clamp(12px, 2.5vh, 20px)" }}>Connexion</p>

                <form onSubmit={handleSubmit} className="ecran-auth-formulaire">
                    {role === "student" && (
                        <>
                            <div>
                                <label className="champ-icone-label">Email</label>
                                <div className="champ-icone">
                                    <span className="icone">mail</span>
                                    <input type="email" placeholder="exemple@domaine.com" value={form.email}
                                        onChange={(e) => updateField("email", e.target.value)} required autoFocus />
                                </div>
                            </div>
                            <div>
                                <label className="champ-icone-label">Mot de passe</label>
                                <div className="champ-icone">
                                    <span className="icone">lock</span>
                                    <input type={voirMotDePasse ? "text" : "password"} placeholder="Votre mot de passe" value={form.password}
                                        onChange={(e) => updateField("password", e.target.value)} required />
                                    <button type="button" className="champ-icone-bouton-oeil" onClick={() => setVoirMotDePasse((v) => !v)}>
                                        <span className="icone" style={{ fontSize: 18 }}>{voirMotDePasse ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {(role === "teacher" || role === "admin") && (
                        <div>
                            <label className="champ-icone-label">Clé d'accès {role === "teacher" ? "professeur" : "administration"}</label>
                            <div className="champ-icone">
                                <span className="icone">vpn_key</span>
                                <input type="text" placeholder="Votre clé d'accès" value={form.accessKey}
                                    onChange={(e) => updateField("accessKey", e.target.value)} required autoFocus />
                            </div>
                        </div>
                    )}

                    {role === "parent" && (
                        <>
                            <div>
                                <label className="champ-icone-label">Numéro de téléphone</label>
                                <div className="champ-icone">
                                    <span className="icone">call</span>
                                    <input type="tel" placeholder="+226 •• •• •• ••" value={form.phone}
                                        onChange={(e) => updateField("phone", e.target.value)} required autoFocus />
                                </div>
                            </div>
                            <div>
                                <label className="champ-icone-label">Code parent (4 chiffres)</label>
                                <div className="champ-icone">
                                    <span className="icone">pin</span>
                                    <input type="text" inputMode="numeric" maxLength={4} placeholder="••••" value={form.parentCode}
                                        onChange={(e) => updateField("parentCode", e.target.value)} required />
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="bouton-bleu-fleche" disabled={submitting}>
                        {submitting ? "Connexion..." : "Se connecter"}
                        {!submitting && <span className="icone" style={{ fontSize: 17 }}>arrow_forward</span>}
                    </button>

                    {erreur && <p style={{ color: "var(--danger)", fontSize: 12.5 }}>{erreur}</p>}
                    {succes && <p style={{ color: "var(--success)", fontSize: 12.5 }}>{succes}</p>}
                </form>

                <div style={{ marginTop: 14 }}>
                    {role === "student" && (
                        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                            Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
                            <br />
                            <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
                        </p>
                    )}
                    {role === "teacher" && (
                        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                            Première connexion ? <Link to="/activation-professeur">Activer mon compte avec ma clé</Link>
                        </p>
                    )}
                    {(role === "admin" || role === "parent") && (
                        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                            Les accès de ce rôle sont fournis par l'administration.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}