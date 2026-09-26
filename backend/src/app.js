import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import structureRoutes from "./routes/structure.routes.js";
import comptesRoutes from "./routes/comptes.routes.js";
import clesProfesseurRoutes from "./routes/cles-professeur.routes.js";
import publicationsRoutes from "./routes/publications.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import fichesRoutes from "./routes/fiches.routes.js";
import etudiantRoutes from "./routes/etudiant.routes.js";
import parentRoutes from "./routes/parent.routes.js";
import statistiquesRoutes from "./routes/statistiques.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/structure", structureRoutes);
app.use("/api/administration", comptesRoutes);
app.use("/api", clesProfesseurRoutes);
app.use("/api/publications", publicationsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/administration/fiches", fichesRoutes);
app.use("/api", etudiantRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/administration/statistiques", statistiquesRoutes);

// Route de vérification rapide que le serveur tourne.
app.get("/api/sante", (req, res) => {
    res.json({ statut: "ok" });
});

// Gestionnaire d'erreurs global : sans lui, une erreur (fichier trop
// lourd, type refusé, etc.) renvoyait une page HTML que le front ne
// pouvait pas lire, et l'erreur disparaissait silencieusement.
app.use((erreur, req, res, next) => {
    console.error(erreur);
    if (erreur.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ erreur: "Le fichier dépasse la taille maximale autorisée (20 Mo)." });
    }
    res.status(400).json({ erreur: erreur.message || "Une erreur est survenue." });
});