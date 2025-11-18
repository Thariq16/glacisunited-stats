import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";
import Players from "./pages/Players";
import OppositionPlayers from "./pages/OppositionPlayers";
import TeamStats from "./pages/TeamStats";
import PlayerProfile from "./pages/PlayerProfile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminPlayers from "./pages/AdminPlayers";
import AdminUpload from "./pages/AdminUpload";
import AdminMatchUpload from "./pages/AdminMatchUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/players" element={<AdminPlayers />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
            <Route path="/admin/match-upload" element={<AdminMatchUpload />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
            <Route path="/players" element={<Players />} />
            <Route path="/opposition-players" element={<OppositionPlayers />} />
            <Route path="/team/:teamId" element={<TeamStats />} />
            <Route path="/team/:teamId/player/:playerName" element={<PlayerProfile />} />
            <Route path="/import" element={<AdminUpload />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
