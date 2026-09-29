import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstallScreen from "./pages/InstallScreen.jsx";
import LoginScreen from "./pages/LoginScreen.jsx";
import InscriptionEtudiant from "./pages/InscriptionEtudiant.jsx";
import ActivationProfesseur from "./pages/ActivationProfesseur.jsx";
import MotDePasseOublie from "./pages/MotDePasseOublie.jsx";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse.jsx";
import RequireInstalled from "./pages/RequireInstalled.jsx";
import ProfesseurLayout from "./pages/professeur/ProfesseurLayout.jsx";
import ProfesseurAccueil from "./pages/professeur/ProfesseurAccueil.jsx";
import ProfesseurPublicationsLecture from "./pages/professeur/ProfesseurPublicationsLecture.jsx";
import ProfesseurBibliotheque from "./pages/professeur/ProfesseurBibliotheque.jsx";
import ProfesseurProfil from "./pages/professeur/ProfesseurProfil.jsx";
import EtudiantLayout from "./pages/etudiant/EtudiantLayout.jsx";
import EtudiantAccueil from "./pages/etudiant/EtudiantAccueil.jsx";
import EtudiantPublicationsLecture from "./pages/etudiant/EtudiantPublicationsLecture.jsx";
import EtudiantProfil from "./pages/etudiant/EtudiantProfil.jsx";
import EtudiantIA from "./pages/etudiant/EtudiantIA.jsx";
import EtudiantGroupes from "./pages/etudiant/EtudiantGroupes.jsx";
import ParentLayout from "./pages/parent/ParentLayout.jsx";
import ParentAccueil from "./pages/parent/ParentAccueil.jsx";
import ParentPublicationsLecture from "./pages/parent/ParentPublicationsLecture.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminAccueil from "./pages/admin/AdminAccueil.jsx";
import AdminPublications from "./pages/admin/AdminPublications.jsx";
import AdminProfil from "./pages/admin/AdminProfil.jsx";
import IndicateurHorsLigne from "./components/IndicateurHorsLigne.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <IndicateurHorsLigne />
            <Routes>
                <Route path="/" element={<InstallScreen />} />
                <Route path="/connexion" element={<RequireInstalled><LoginScreen /></RequireInstalled>} />
                <Route path="/inscription" element={<RequireInstalled><InscriptionEtudiant /></RequireInstalled>} />
                <Route path="/activation-professeur" element={<RequireInstalled><ActivationProfesseur /></RequireInstalled>} />
                <Route path="/mot-de-passe-oublie" element={<RequireInstalled><MotDePasseOublie /></RequireInstalled>} />
                <Route path="/reinitialiser-mot-de-passe" element={<RequireInstalled><ReinitialiserMotDePasse /></RequireInstalled>} />
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
                <Route path="/etudiant" element={<EtudiantLayout />}>
                    <Route index element={<EtudiantAccueil />} />
                    <Route path="info" element={<EtudiantPublicationsLecture categorie="info" />} />
                    <Route path="bibliotheque" element={<EtudiantPublicationsLecture categorie="bibliotheque" />} />
                    <Route path="planning" element={<EtudiantPublicationsLecture categorie="planning" />} />
                    <Route path="profil" element={<EtudiantProfil />} />
                    <Route path="ia" element={<EtudiantIA />} />
                    <Route path="groupes" element={<EtudiantGroupes />} />
                </Route>
                <Route path="/parent" element={<ParentLayout />}>
                    <Route index element={<ParentAccueil />} />
                    <Route path="info" element={<ParentPublicationsLecture categorie="info" />} />
                    <Route path="planning" element={<ParentPublicationsLecture categorie="planning" />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}