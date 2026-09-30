import dotenv from "dotenv";
dotenv.config();

// Modèle Gemini à utiliser. "gemini-2.0-flash" est rapide et peu coûteux,
// bien adapté à un assistant de questions-réponses. Si Google en propose
// un plus récent au moment où tu déploies, tu peux changer cette valeur
// (liste des modèles disponibles sur aistudio.google.com).
const MODELE = "gemini-3.8-flash";

export async function poserQuestion(req, res) {
    const { question, matiere } = req.body;

    if (!question || !question.trim()) {
        return res.status(400).json({ erreur: "La question ne peut pas être vide." });
    }
    if (!process.env.GOOGLE_AI_API_KEY) {
        return res.status(503).json({
            erreur: "L'assistant IA n'est pas encore configuré (clé API manquante côté serveur).",
        });
    }

    const consigne = matiere
        ? `Tu es un assistant pédagogique qui aide un étudiant dans le cours de ${matiere}. Réponds en français, de façon claire et pas trop longue, adaptée à un étudiant.`
        : `Tu es un assistant pédagogique qui aide un étudiant dans ses études. Réponds en français, de façon claire et pas trop longue.`;

    try {
        console.log(`\n[Assistant IA] Question reçue, appel à Google AI Studio (modèle: ${MODELE})...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

        const reponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: consigne }] },
                contents: [{ parts: [{ text: question }] }],
            }),
        });

        const donnees = await reponse.json();

        if (!reponse.ok) {
            console.error(`\n❌ [Assistant IA] Erreur Google (statut HTTP ${reponse.status}) :`);
            console.error(JSON.stringify(donnees, null, 2), "\n");
            return res.status(502).json({ erreur: "L'assistant IA n'a pas pu répondre pour l'instant." });
        }

        console.log("[Assistant IA] Réponse reçue avec succès.\n");
        const texte = donnees.candidates?.[0]?.content?.parts?.[0]?.text || "";
        res.json({ reponse: texte });
    } catch (erreur) {
        console.error("\n❌ [Assistant IA] Erreur inattendue :", erreur, "\n");
        res.status(502).json({ erreur: "L'assistant IA n'a pas pu répondre pour l'instant." });
    }
}