import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dossierUploads = path.join(__dirname, "..", "..", "uploads");

// Crée le dossier de stockage s'il n'existe pas encore.
if (!fs.existsSync(dossierUploads)) {
    fs.mkdirSync(dossierUploads, { recursive: true });
}

const stockage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dossierUploads),
    filename: (req, file, cb) => {
        const nomUnique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, nomUnique);
    },
});

const TYPES_AUTORISES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export const uploadPublication = multer({
    storage: stockage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo maximum
    fileFilter: (req, file, cb) => {
        if (TYPES_AUTORISES.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Type de fichier non autorisé. PDF, PNG, JPEG ou WEBP uniquement."));
    },
});