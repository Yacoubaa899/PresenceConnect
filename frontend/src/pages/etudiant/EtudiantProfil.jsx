import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function EtudiantProfil() {
    const [profil, setProfil] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(null);
    const [envoiPhoto, setEnvoiPhoto] = useState(false);

    useEffect(() => {
        charger();
    }, []);

    async function charger() {
        setChargement(true);
        try {
            setProfil(await apiFetch("/mon-profil"));
        } catch (e) {
            setErreur(e.message);
        } finally {
            setChargement(false);
        }
    }

    async function changerPhoto(e) {
        const fichier = e.target.files[0];
        if (!fichier) return;
        setEnvoiPhoto(true);
        setErreur(null);
        try {
            const donnees = new FormData();
            donnees.append("photo", fichier);
            await apiFetch("/mon-profil/photo", { method: "POST", body: donnees });
            charger();
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoiPhoto(false);
        }
    }

    if (chargement) return <p style={{ padding: 18 }}>Chargement...</p>;
    if (!profil) return <p style={{ padding: 18, color: "var(--danger)" }}>{erreur}</p>;

    return (
        <div className="onglet-contenu">
            <section className="box admin-section" style={{ textAlign: "center" }}>
                {profil.photo_profil ? (
                    <img
                        src={`http://localhost:4000${profil.photo_profil}`}
                        alt=""
                        style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px" }}
                    />
                ) : (
                    <div style={{
                        width: 96, height: 96, borderRadius: "50%", background: "var(--primary-soft)",
                        color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px", fontSize: 28, fontWeight: 700,
                    }}>
                        {profil.prenom?.[0]}{profil.nom?.[0]}
                    </div>
                )}
                <h2 style={{ marginBottom: 4 }}>{profil.prenom} {profil.nom}</h2>
                <p className="texte-discret">{profil.filiere_nom} — {profil.classe_nom}</p>

                <label className="submit-button" style={{ display: "inline-block", cursor: "pointer", marginTop: 10 }}>
                    {envoiPhoto ? "Envoi..." : "Changer ma photo de profil"}
                    <input type="file" accept="image/*" onChange={changerPhoto} style={{ display: "none" }} />
                </label>
                {erreur && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{erreur}</p>}
            </section>

            <section className="box admin-section">
                <h2>Mes informations</h2>
                <div className="fiche-info">
                    <div><span>Numéro étudiant</span><strong>{profil.numero_etudiant}</strong></div>
                    <div><span>E-mail</span><strong>{profil.email}</strong></div>
                    <div><span>Téléphone</span><strong>{profil.telephone}</strong></div>
                    <div><span>Sexe</span><strong>{profil.sexe === "M" ? "Masculin" : "Féminin"}</strong></div>
                    <div><span>Âge</span><strong>{profil.age} ans</strong></div>
                </div>
            </section>

            <section className="box admin-section">
                <h2>Connexion parent</h2>
                <p className="texte-discret" style={{ marginBottom: 10 }}>
                    Transmettez ces informations au parent pour qu'il puisse suivre votre assiduité.
                </p>
                <div className="fiche-info">
                    <div><span>Numéro de téléphone</span><strong>{profil.telephone_parent}</strong></div>
                    <div><span>Code parent</span><strong>{profil.code_parent?.slice(-4)}</strong></div>
                </div>
            </section>
        </div>
    );
}