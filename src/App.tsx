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

// Eagerly loaded pages (public, frequently accessed)
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Players from "./pages/Players";
import OppositionPlayers from "./pages/OppositionPlayers";
import TeamStats from "./pages/TeamStats";
import PlayerProfile from "./pages/PlayerProfile";
import SquadAnalysis from "./pages/SquadAnalysis";
import Seasons from "./pages/Seasons";
import PlayerComparison from "./pages/PlayerComparison";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages
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
              <Route path="/seasons" element={<Seasons />} />
              <Route path="/compare" element={<PlayerComparison />} />
              <Route path="/team/:teamId" element={<TeamStats />} />
              <Route path="/team/:teamId/player/:playerName" element={<PlayerProfile />} />


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

