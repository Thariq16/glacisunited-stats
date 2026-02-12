import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { InstallPrompt } from "@/components/InstallPrompt";

// Eagerly loaded pages (public, frequently accessed)
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Players from "./pages/Players";
import OppositionPlayers from "./pages/OppositionPlayers";
import TeamStats from "./pages/TeamStats";
import PlayerProfile from "./pages/PlayerProfile";
import SquadAnalysis from "./pages/SquadAnalysis";
import PlayerComparison from "./pages/PlayerComparison";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (admin routes - heavy components)
const Admin = lazy(() => import("@/features/admin/pages/Admin"));
const AdminPlayers = lazy(() => import("@/features/admin/pages/AdminPlayers"));
const AdminUpload = lazy(() => import("@/features/admin/pages/AdminUpload"));
const AdminMatchUpload = lazy(() => import("@/features/admin/pages/AdminMatchUpload"));
const AdminComments = lazy(() => import("@/features/admin/pages/AdminComments"));
const AdminMatchEvents = lazy(() => import("@/features/admin/pages/AdminMatchEvents"));
const AdminMatchSelect = lazy(() => import("@/features/admin/pages/AdminMatchSelect"));
const AdminNewMatch = lazy(() => import("@/features/admin/pages/AdminNewMatch"));
const AdminSquadSelection = lazy(() => import("@/features/admin/pages/AdminSquadSelection"));
const AdminMatches = lazy(() => import("@/features/admin/pages/AdminMatches"));
const DemoLanding = lazy(() => import("@/pages/demo/Landing"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <SessionExpiryWarning />
          <InstallPrompt />
          <BrowserRouter>
            <Routes>
              {/* Public routes - eagerly loaded */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/demo" element={<Suspense fallback={<PageLoader />}><DemoLanding /></Suspense>} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/match/:matchId" element={<MatchDetail />} />
              <Route path="/players" element={<Players />} />
              <Route path="/opposition-players" element={<OppositionPlayers />} />
              <Route path="/squad-analysis" element={<SquadAnalysis />} />
              <Route path="/compare" element={<PlayerComparison />} />
              <Route path="/team/:teamId" element={<TeamStats />} />
              <Route path="/team/:teamId/player/:playerName" element={<PlayerProfile />} />

              {/* Admin routes - lazy loaded with Suspense */}
              <Route path="/admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
              <Route path="/admin/players" element={<Suspense fallback={<PageLoader />}><AdminPlayers /></Suspense>} />
              <Route path="/admin/upload" element={<Suspense fallback={<PageLoader />}><AdminUpload /></Suspense>} />
              <Route path="/admin/match-upload" element={<Suspense fallback={<PageLoader />}><AdminMatchUpload /></Suspense>} />
              <Route path="/admin/comments" element={<Suspense fallback={<PageLoader />}><AdminComments /></Suspense>} />
              <Route path="/admin/match-select" element={<Suspense fallback={<PageLoader />}><AdminMatchSelect /></Suspense>} />
              <Route path="/admin/matches" element={<Suspense fallback={<PageLoader />}><AdminMatches /></Suspense>} />
              <Route path="/admin/new-match" element={<Suspense fallback={<PageLoader />}><AdminNewMatch /></Suspense>} />
              <Route path="/admin/squad-selection/:matchId" element={<Suspense fallback={<PageLoader />}><AdminSquadSelection /></Suspense>} />
              <Route path="/admin/match-events/:matchId" element={<Suspense fallback={<PageLoader />}><AdminMatchEvents /></Suspense>} />
              <Route path="/import" element={<Suspense fallback={<PageLoader />}><AdminUpload /></Suspense>} />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

