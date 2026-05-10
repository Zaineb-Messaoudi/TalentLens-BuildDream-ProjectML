import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell.jsx";
import { hydrateNavigation } from "./data/uiConfig.jsx";
import { getFrontendBootstrap } from "./services/talentlensService.jsx";
const LandingPage = lazy(() => import("./pages/LandingPage.jsx").then((module) => ({ default: module.LandingPage })));
const RecruiterDashboard = lazy(() => import("./pages/recruiter/RecruiterDashboard.jsx").then((module) => ({ default: module.RecruiterDashboard })));
const PostRolePage = lazy(() => import("./pages/recruiter/PostRolePage.jsx").then((module) => ({ default: module.PostRolePage })));
const OfferIntelligencePage = lazy(() => import("./pages/recruiter/OfferIntelligencePage.jsx").then((module) => ({ default: module.OfferIntelligencePage })));
const CandidateFitPage = lazy(() => import("./pages/recruiter/CandidateFitPage.jsx").then((module) => ({ default: module.CandidateFitPage })));
const MarketPulsePage = lazy(() => import("./pages/recruiter/MarketPulsePage.jsx").then((module) => ({ default: module.MarketPulsePage })));
const CandidateHome = lazy(() => import("./pages/candidate/CandidateHome.jsx").then((module) => ({ default: module.CandidateHome })));
const JobMatchesPage = lazy(() => import("./pages/candidate/JobMatchesPage.jsx").then((module) => ({ default: module.JobMatchesPage })));
const SalaryCheckPage = lazy(() => import("./pages/candidate/SalaryCheckPage.jsx").then((module) => ({ default: module.SalaryCheckPage })));
const GrowthPlanPage = lazy(() => import("./pages/candidate/GrowthPlanPage.jsx").then((module) => ({ default: module.GrowthPlanPage })));
const MarketPositionPage = lazy(() => import("./pages/candidate/MarketPositionPage.jsx").then((module) => ({ default: module.MarketPositionPage })));
const WorkforceIntelligencePage = lazy(() => import("./pages/admin/WorkforceIntelligencePage.jsx").then((module) => ({ default: module.WorkforceIntelligencePage })));
const CompensationAuditPage = lazy(() => import("./pages/admin/CompensationAuditPage.jsx").then((module) => ({ default: module.CompensationAuditPage })));
const TalentSegmentMapPage = lazy(() => import("./pages/admin/TalentSegmentMapPage.jsx").then((module) => ({ default: module.TalentSegmentMapPage })));
const HiringSignalsPage = lazy(() => import("./pages/admin/HiringSignalsPage.jsx").then((module) => ({ default: module.HiringSignalsPage })));

function withShell(nav, content, shell) {
  return <AppShell nav={nav} shell={shell}>{content}</AppShell>;
}

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-text">
      <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-4 text-sm text-muted backdrop-blur-xl">
        Loading TalentLens...
      </div>
    </div>
  );
}

export default function App() {
  const [bootstrap, setBootstrap] = useState(null);

  useEffect(() => {
    let active = true;
    getFrontendBootstrap().then((response) => {
      if (!active) return;
      setBootstrap(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const navigation = hydrateNavigation(bootstrap?.navigation || []);
  const recruiterNav = navigation.filter((group) => group.title === "Recruiter Portal");
  const candidateNav = navigation.filter((group) => group.title === "Candidate Portal");
  const adminNav = navigation.filter((group) => group.title === "Admin Portal");

  if (!bootstrap) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/recruiter" element={withShell(recruiterNav, <RecruiterDashboard />, bootstrap)} />
        <Route path="/recruiter/post-role" element={withShell(recruiterNav, <PostRolePage />, bootstrap)} />
        <Route path="/recruiter/offer-intelligence" element={withShell(recruiterNav, <OfferIntelligencePage />, bootstrap)} />
        <Route path="/recruiter/candidate-fit" element={withShell(recruiterNav, <CandidateFitPage />, bootstrap)} />
        <Route path="/recruiter/market-pulse" element={withShell(recruiterNav, <MarketPulsePage />, bootstrap)} />

        <Route path="/candidate" element={withShell(candidateNav, <CandidateHome />, bootstrap)} />
        <Route path="/candidate/job-matches" element={withShell(candidateNav, <JobMatchesPage />, bootstrap)} />
        <Route path="/candidate/salary-check" element={withShell(candidateNav, <SalaryCheckPage />, bootstrap)} />
        <Route path="/candidate/growth-plan" element={withShell(candidateNav, <GrowthPlanPage />, bootstrap)} />
        <Route path="/candidate/market-position" element={withShell(candidateNav, <MarketPositionPage />, bootstrap)} />

        <Route path="/admin" element={withShell(adminNav, <WorkforceIntelligencePage />, bootstrap)} />
        <Route path="/admin/compensation-audit" element={withShell(adminNav, <CompensationAuditPage />, bootstrap)} />
        <Route path="/admin/talent-segments" element={withShell(adminNav, <TalentSegmentMapPage />, bootstrap)} />
        <Route path="/admin/hiring-signals" element={withShell(adminNav, <HiringSignalsPage />, bootstrap)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
