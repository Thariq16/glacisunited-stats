import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";

interface MatchCardProps {
  match: {
    id: string;
    match_date: string;
    home_score: number;
    away_score: number;
    venue: string | null;
    competition: string | null;
    home_team: { id: string; name: string; slug: string } | null;
    away_team: { id: string; name: string; slug: string } | null;
  };
}

export function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary"
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline">{match.competition || 'Match'}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(match.match_date).toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-foreground">{match.home_team?.name || 'Home Team'}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-foreground">{match.home_score}</span>
              <span className="text-xl text-muted-foreground">-</span>
              <span className="text-3xl font-bold text-foreground">{match.away_score}</span>
            </div>
          </div>
          
          <div className="text-left">
            <p className="font-semibold text-foreground">{match.away_team?.name || 'Away Team'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-4">
          <MapPin className="h-4 w-4" />
          {match.venue || 'TBD'}
        </div>
      </CardContent>
    </Card>
  );
}
