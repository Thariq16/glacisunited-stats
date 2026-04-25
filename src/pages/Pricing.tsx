import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignupDialog } from "@/components/pricing/SignupDialog";

type PackageId = "essentials" | "pro";

interface PricingPackage {
  id: PackageId;
  name: string;
  tagline: string;
  price: string;
  priceUnit: string;
  trial: string;
  highlight?: boolean;
  features: string[];
  bestFor: string;
}

const packages: PricingPackage[] = [
  {
    id: "essentials",
    name: "Team Essentials",
    tagline: "Match-day fundamentals for coaches who want clear, fast insights.",
    price: "$25",
    priceUnit: "/ match",
    trial: "1 month free · 3 matches included",
    bestFor: "Grassroots & semi-pro teams",
    features: [
      "Full match stats table (goals, passes, shots, tackles)",
      "Player ratings and per-match scorecards",
      "Pass distribution grid visualization",
      "Match score header with W/D/L tracking",
      "Analyst notes per match (1st half / 2nd half)",
      "Downloadable PDF match report",
      "Public team page for sharing results",
    ],
  },
  {
    id: "pro",
    name: "Pro Analytics",
    tagline: "Deep tactical breakdowns trusted by performance staff.",
    price: "$100",
    priceUnit: "/ match",
    trial: "1 month free · 3 matches included",
    highlight: true,
    bestFor: "Competitive clubs & academies",
    features: [
      "Everything in Team Essentials",
      "Full event tagging: shots, xG, defensive actions, set pieces",
      "Attacking phase breakdowns with sequence visualizations",
      "Player profiles: shot maps, defensive maps, pass maps",
      "Player performance trends vs season averages",
      "Squad analysis (overall + per-match dual view)",
      "Set piece analytics & possession-loss heatmaps",
      "Player comparison tool across matches",
      "Season-level dashboards & season report",
      "Priority turnaround on match analysis",
    ],
  },
];

export default function Pricing() {
  const [selected, setSelected] = useState<PackageId | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-sm font-semibold tracking-tight">FootyMetrics</div>
          <Link to="/demo">
            <Button variant="ghost" size="sm">View demo</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="mr-1.5 h-3 w-3" />
          1 month free · No credit card required
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Professional video analysis for your team
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Manual match tagging by an experienced analyst, delivered as coach-ready dashboards
          and player profiles. Pick the level of depth your team needs.
        </p>
      </section>

      {/* Packages */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${
                pkg.highlight ? "border-primary shadow-lg ring-1 ring-primary/20" : ""
              }`}
            >
              {pkg.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Trophy className="mr-1 h-3 w-3" />
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="text-sm">{pkg.tagline}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.priceUnit}</span>
                </div>
                <p className="text-sm text-primary font-medium">{pkg.trial}</p>
                <p className="text-xs text-muted-foreground mt-1">Best for: {pkg.bestFor}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant={pkg.highlight ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setSelected(pkg.id)}
                >
                  Start free trial
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ-ish footer notes */}
        <div className="mx-auto mt-12 max-w-3xl text-center text-sm text-muted-foreground">
          <p>
            After your free month (3 matches), pricing is per match — pay only when you book a match
            for analysis. Cancel anytime, no contracts.
          </p>
        </div>
      </section>

      <SignupDialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        packageId={selected}
        packageName={selected ? packages.find((p) => p.id === selected)!.name : ""}
      />
    </div>
  );
}
