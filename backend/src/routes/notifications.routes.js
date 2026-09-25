import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { mesNotifications, marquerNotificationLue, marquerToutesLues, supprimerNotification, supprimerToutesNotifications } from "../controllers/notifications.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", mesNotifications);
router.post("/:id/lue", marquerNotificationLue);
router.post("/tout-marquer-lu", marquerToutesLues);
router.delete("/tout-supprimer", supprimerToutesNotifications);
router.delete("/:id", supprimerNotification);

export default router;