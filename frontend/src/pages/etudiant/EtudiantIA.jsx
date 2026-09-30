import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../utils/api.js";

export default function EtudiantIA() {
    const [matieres, setMatieres] = useState([]);
    const [matiereChoisie, setMatiereChoisie] = useState("");
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState(null);
    const finDeListe = useRef(null);

    useEffect(() => {
        apiFetch("/structure/matieres").then(setMatieres).catch(() => { });
    }, []);

    useEffect(() => {
        finDeListe.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function envoyerQuestion(e) {
        e.preventDefault();
        if (!question.trim() || envoi) return;

        const questionEnvoyee = question;
        setMessages((prev) => [...prev, { role: "utilisateur", texte: questionEnvoyee }]);
        setQuestion("");
        setErreur(null);
        setEnvoi(true);

        try {
            const nomMatiere = matieres.find((m) => String(m.id) === matiereChoisie)?.nom;
            const resultat = await apiFetch("/ia/question", {
                method: "POST",
                body: { question: questionEnvoyee, matiere: nomMatiere },
            });
            setMessages((prev) => [...prev, { role: "assistant", texte: resultat.reponse }]);
        } catch (e) {
            setErreur(e.message);
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className="onglet-contenu">
            <section className="box admin-section">
                <h2>Assistant IA</h2>
                <p className="texte-discret" style={{ marginBottom: 10 }}>
                    Pose une question sur un cours ou fais une recherche.
                </p>

                <select value={matiereChoisie} onChange={(e) => setMatiereChoisie(e.target.value)} style={{ marginBottom: 10 }}>
                    <option value="">Question générale (aucune matière précise)</option>
                    {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>

                <div className="fil-discussion-ia">
                    {messages.length === 0 && (
                        <p className="texte-discret" style={{ textAlign: "center", padding: "20px 0" }}>
                            Pose ta première question ci-dessous.
                        </p>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={"bulle-ia " + m.role}>
                            {m.texte}
                        </div>
                    ))}
                    {envoi && <div className="bulle-ia assistant">Réflexion en cours...</div>}
                    <div ref={finDeListe} />
                </div>

                {erreur && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erreur}</p>}

                <form onSubmit={envoyerQuestion} className="ligne-formulaire" style={{ marginTop: 10 }}>
                    <input
                        placeholder="Ta question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                    <button type="submit" className="submit-button" style={{ width: "auto" }} disabled={envoi}>
                        Envoyer
                    </button>
                </form>
            </section>
        </div>
    );
}