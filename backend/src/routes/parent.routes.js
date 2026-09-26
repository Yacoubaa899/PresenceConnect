import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { monEnfant, statistiquesEnfant, historiqueEnfant } from "../controllers/parent.controller.js";

const router = Router();

router.use(requireAuth, requireRole("parent"));

router.get("/mon-enfant", monEnfant);
router.get("/mon-enfant/statistiques", statistiquesEnfant);
router.get("/mon-enfant/historique", historiqueEnfant);

export default router;