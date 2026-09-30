import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// N'existe que si les identifiants Gmail sont configurés dans .env.
// Tant que ce n'est pas le cas, envoyerEmail() échoue proprement et
// l'appelant peut se replier sur le mode test (lien affiché à l'écran).
function creerTransporteur() {
    if (!process.env.GMAIL_UTILISATEUR || !process.env.GMAIL_MOT_DE_PASSE_APPLICATION) {
        return null;
    }
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_UTILISATEUR,
            pass: process.env.GMAIL_MOT_DE_PASSE_APPLICATION,
        },
    });
}

export async function envoyerEmail({ destinataire, sujet, texte, html }) {
    const transporteur = creerTransporteur();
    if (!transporteur) {
        throw new Error("Service d'e-mail non configuré (GMAIL_UTILISATEUR / GMAIL_MOT_DE_PASSE_APPLICATION manquants).");
    }

    await transporteur.sendMail({
        from: `"PresenceConnect" <${process.env.GMAIL_UTILISATEUR}>`,
        to: destinataire,
        subject: sujet,
        text: texte,
        html,
    });
}