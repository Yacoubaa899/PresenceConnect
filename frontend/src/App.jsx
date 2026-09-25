import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstallScreen from "./pages/InstallScreen.jsx";
import LoginScreen from "./pages/LoginScreen.jsx";
import InscriptionEtudiant from "./pages/InscriptionEtudiant.jsx";
import ActivationProfesseur from "./pages/ActivationProfesseur.jsx";
import RequireInstalled from "./pages/RequireInstalled.jsx";
import ProfesseurLayout from "./pages/professeur/ProfesseurLayout.jsx";
import ProfesseurAccueil from "./pages/professeur/ProfesseurAccueil.jsx";
import ProfesseurPublicationsLecture from "./pages/professeur/ProfesseurPublicationsLecture.jsx";
import ProfesseurBibliotheque from "./pages/professeur/ProfesseurBibliotheque.jsx";
import ProfesseurProfil from "./pages/professeur/ProfesseurProfil.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminAccueil from "./pages/admin/AdminAccueil.jsx";
import AdminPublications from "./pages/admin/AdminPublications.jsx";
import AdminProfil from "./pages/admin/AdminProfil.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<InstallScreen />} />
                <Route path="/connexion" element={<RequireInstalled><LoginScreen /></RequireInstalled>} />
                <Route path="/inscription" element={<RequireInstalled><InscriptionEtudiant /></RequireInstalled>} />
                <Route path="/activation-professeur" element={<RequireInstalled><ActivationProfesseur /></RequireInstalled>} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminAccueil />} />
                    <Route path="info" element={<AdminPublications categorie="info" />} />
                    <Route path="planning" element={<AdminPublications categorie="planning" />} />
                    <Route path="bibliotheque" element={<AdminPublications categorie="bibliotheque" />} />
                    <Route path="profil" element={<AdminProfil />} />
                </Route>
                <Route path="/professeur" element={<ProfesseurLayout />}>
                    <Route index element={<ProfesseurAccueil />} />
                    <Route path="info" element={<ProfesseurPublicationsLecture categorie="info" />} />
                    <Route path="planning" element={<ProfesseurPublicationsLecture categorie="planning" />} />
                    <Route path="bibliotheque" element={<ProfesseurBibliotheque />} />
                    <Route path="profil" element={<ProfesseurProfil />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}