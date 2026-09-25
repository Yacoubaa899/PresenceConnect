import dotenv from "dotenv";
dotenv.config();

import { app } from "./src/app.js";
import { demarrerTachesPlanifiees } from "./src/utils/scheduler.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Serveur PresenceConnect démarré sur http://localhost:${PORT}`);
    demarrerTachesPlanifiees();
});