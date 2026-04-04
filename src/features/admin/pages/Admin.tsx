import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Upload, Users, MessageSquare, MousePointer2, Calendar, Timer, Trophy, Settings } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgPath } from "@/hooks/useOrgPath";

function AdminContent() {
  const navigate = useNavigate();
  const { isOrgAdmin } = useOrganization();
  const orgPath = useOrgPath();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              {isOrgAdmin ? 'Admin Dashboard' : 'Coach Dashboard'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isOrgAdmin
              ? 'Manage players, matches, and statistics'
              : 'View match analysis and notes'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {isOrgAdmin && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/players'))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manage Players
                </CardTitle>
                <CardDescription>Edit player profiles, update statistics, and manage team rosters</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">Go to Players</Button>
              </CardContent>
            </Card>
          )}

          {isOrgAdmin && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/match-upload'))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Match Data
                </CardTitle>
                <CardDescription>Import new match statistics from CSV files for any teams</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">Upload Data</Button>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/comments'))}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Analyst Notes
              </CardTitle>
              <CardDescription>
                {isOrgAdmin ? 'Add and manage analyst notes for matches that coaches can view' : 'View analyst notes and add replies'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">{isOrgAdmin ? 'Manage Notes' : 'View Notes'}</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('squad-analysis'))}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Squad Analysis
              </CardTitle>
              <CardDescription>View comprehensive team intelligence, shot maps, and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">View Analysis</Button>
            </CardContent>
          </Card>

          {isOrgAdmin && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/matches'))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Manage Matches
                </CardTitle>
                <CardDescription>View, edit, and delete existing matches</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">View Matches</Button>
              </CardContent>
            </Card>
          )}

          {isOrgAdmin && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/new-match'))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer2 className="h-5 w-5" />
                  Create New Match
                </CardTitle>
                <CardDescription>Create a new match and log detailed events with coordinates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">New Match</Button>
              </CardContent>
            </Card>
          )}

          {isOrgAdmin && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/data-entry-stats'))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Data Entry Stats
                </CardTitle>
                <CardDescription>Track how long it takes to complete match event data entry</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">View Stats</Button>
              </CardContent>
            </Card>
          )}

          {isOrgAdmin && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(orgPath('admin/seasons'))}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Manage Seasons
                </CardTitle>
                <CardDescription>Create seasons, assign date ranges, and mark seasons as complete</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">View Seasons</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Admin() {
  return (
    <ProtectedRoute requireCoach>
      <AdminContent />
    </ProtectedRoute>
  );
}
