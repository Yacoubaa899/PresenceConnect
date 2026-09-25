import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listerFiches, detailFiche, exporterFichePdf } from "../controllers/fiches.controller.js";

const router = Router();

router.use(requireAuth, requireRole("administration"));

router.get("/", listerFiches);
router.get("/:id", detailFiche);
router.get("/:id/pdf", exporterFichePdf);

export default router;