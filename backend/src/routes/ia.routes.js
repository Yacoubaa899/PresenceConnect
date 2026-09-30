import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { poserQuestion } from "../controllers/ia.controller.js";

const router = Router();

router.post("/ia/question", requireAuth, requireRole("etudiant"), poserQuestion);

export default router;