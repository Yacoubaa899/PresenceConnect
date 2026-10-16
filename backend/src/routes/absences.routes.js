import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listerAbsencesAdmin } from "../controllers/absences.controller.js";

const router = Router();

router.get("/administration/absences", requireAuth, requireRole("administration"), listerAbsencesAdmin);

export default router;