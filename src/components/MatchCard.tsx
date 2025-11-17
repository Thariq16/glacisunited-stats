import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { Match } from "@/data/matchData";

interface MatchCardProps {
  match: Match;
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
          <Badge variant="outline">{match.competition}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(match.date).toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-foreground">{match.homeTeam}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-foreground">{match.score.home}</span>
              <span className="text-xl text-muted-foreground">-</span>
              <span className="text-3xl font-bold text-foreground">{match.score.away}</span>
            </div>
          </div>
          
          <div className="text-left">
            <p className="font-semibold text-foreground">{match.awayTeam}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-4">
          <MapPin className="h-4 w-4" />
          {match.venue}
        </div>
      </CardContent>
    </Card>
  );
}
