import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { envoyerNote, listerNotesAdmin, mesNotes, notesEnfant } from "../controllers/notes.controller.js";

const router = Router();

router.post("/administration/notes", requireAuth, requireRole("administration"), envoyerNote);
router.get("/administration/notes", requireAuth, requireRole("administration"), listerNotesAdmin);

router.get("/mes-notes", requireAuth, requireRole("etudiant"), mesNotes);
router.get("/parent/mon-enfant/notes", requireAuth, requireRole("parent"), notesEnfant);

export default router;