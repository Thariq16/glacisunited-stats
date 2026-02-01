
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SquadAnalysisView } from "@/components/views/SquadAnalysisView";
import { PlayerProfileView } from "@/components/views/PlayerProfileView";
import { DEMO_SQUAD, DEMO_ATTACKING_PHASES, DEMO_PASS_DATA, DEMO_EVENTS, DEMO_MATCH_HISTORY, DEMO_SET_PIECE_STATS, DEMO_DEFENSIVE_EVENTS, DEMO_PLAYER_CORNER_STATS, DEMO_ATTACKING_THREAT, DEMO_LOST_POSSESSION } from "@/data/demo/mockData";
import { Button } from "@/components/ui/button";
import { Info, User, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

type ViewMode = 'coach' | 'player';

export default function DemoLanding() {
    const [viewMode, setViewMode] = useState<ViewMode>('coach');

    // For Player View, we select the "Star Player" (Index 0 in mock data)
    const demoPlayer = DEMO_SQUAD[0];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="container mx-auto px-4 py-8 flex-1">
                {/* Demo Context Banner */}
                <div className="mb-8">
                    <Alert className="bg-primary/10 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-semibold">Demo Mode Active</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            You are viewing a demonstration with <strong>simulated data</strong>.
                            This showcases the platform's capabilities without exposing real client data.
                        </AlertDescription>
                    </Alert>
                </div>

                {/* View Mode Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Platform Interactive Demo</h1>
                        <p className="text-muted-foreground">Experience the detailed analytics provided to our partner clubs.</p>
                    </div>

                    <div className="flex gap-2 bg-muted p-1 rounded-lg">
                        <Button
                            variant={viewMode === 'coach' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('coach')}
                            className="gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Coach View
                        </Button>
                        <Button
                            variant={viewMode === 'player' ? 'default' : 'ghost'}
                            onClick={() => setViewMode('player')}
                            className="gap-2"
                        >
                            <User className="h-4 w-4" />
                            Player View
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in duration-500">
                    {viewMode === 'coach' ? (
                        <div className="space-y-4">
                            <div className="bg-card border rounded-lg p-6 mb-6">
                                <h3 className="font-semibold text-lg mb-2">🎓 Coach's Perspective</h3>
                                <p className="text-muted-foreground">
                                    As a coach, you get immediate insight into squad depth, performance trends, and an AI-suggested Best XI based on form.
                                </p>
                            </div>
                            <SquadAnalysisView
                                players={DEMO_SQUAD}
                                phases={DEMO_ATTACKING_PHASES}
                                events={DEMO_EVENTS}
                                history={DEMO_MATCH_HISTORY}
                                setPieceStats={DEMO_SET_PIECE_STATS}
                                playerSetPieceStats={DEMO_PLAYER_CORNER_STATS}
                                defensiveEvents={DEMO_DEFENSIVE_EVENTS}
                                attackingThreat={DEMO_ATTACKING_THREAT}
                                possessionLossEvents={DEMO_LOST_POSSESSION}
                                teamName="Demo Team"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-card border rounded-lg p-6 mb-6">
                                <h3 className="font-semibold text-lg mb-2">⚽ Player's Perspective</h3>
                                <p className="text-muted-foreground">
                                    Players receive a professional-grade profile card. They can track their development in passing, shooting, and defensive work rates over the season.
                                </p>
                            </div>
                            <PlayerProfileView player={demoPlayer} passData={DEMO_PASS_DATA} />
                        </div>
                    )}
                </div>

            </main>
            <Footer />
        </div>
    );
}
