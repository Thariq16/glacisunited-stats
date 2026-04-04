import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MatchCard } from "@/components/MatchCard";
import { useMatches } from "@/hooks/usePlayerStats";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Trophy, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllMatchComments } from "@/components/AllMatchComments";
import { useTranslation } from "react-i18next";

export default function Matches() {
  const { data: matches, isLoading } = useMatches();
  const { isOrgAdmin, orgRole } = useOrganization();
  const { t } = useTranslation();
  const showComments = isOrgAdmin || orgRole === 'coach' || orgRole === 'analyst';

  const matchGrid = isLoading ? (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  ) : (
    <div className="grid gap-4 md:grid-cols-2">
      {matches?.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{t("matches.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("matches.subtitle")}</p>
        </div>

        {showComments ? (
          <Tabs defaultValue="matches" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {t("matches.title")}
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t("matches.analystNotes")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="matches">{matchGrid}</TabsContent>
            <TabsContent value="comments"><AllMatchComments /></TabsContent>
          </Tabs>
        ) : matchGrid}
      </main>
      <Footer />
    </div>
  );
}
