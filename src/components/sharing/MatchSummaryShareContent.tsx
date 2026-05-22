interface Props {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeXG?: number;
  awayXG?: number;
}

/** Big scoreline used inside ShareableCard body for a match summary share. */
export function MatchSummaryShareContent({ homeTeam, awayTeam, homeScore, awayScore, homeXG, awayXG }: Props) {
  const row = (name: string, score: number, xg?: number) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.01em" }}>{name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        {xg !== undefined && (
          <div style={{ fontSize: 22, color: "#94a3b8" }}>xG {xg.toFixed(2)}</div>
        )}
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {score}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 28 }}>
      {row(homeTeam, homeScore, homeXG)}
      <div style={{ height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
      {row(awayTeam, awayScore, awayXG)}
    </div>
  );
}
