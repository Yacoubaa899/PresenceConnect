import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { statistiquesGlobales, statistiquesParFiliere } from "../controllers/statistiques.controller.js";

const router = Router();

router.use(requireAuth, requireRole("administration"));

router.get("/globales", statistiquesGlobales);
router.get("/par-filiere", statistiquesParFiliere);

export default router;