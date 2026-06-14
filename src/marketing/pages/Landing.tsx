import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroSection } from "@/marketing/components/HeroSection";
import { StatsCounter } from "@/marketing/components/StatsCounter";
import { FAQSection } from "@/marketing/components/FAQSection";
import { MarketingLayout } from "@/marketing/layouts/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, Check, ArrowRight, Video, Award, Activity, 
  BarChart3, Users, Clock, ShieldCheck, Star, 
  ChevronRight, Sparkles, MessageSquare, Flame
} from "lucide-react";
import { Link } from "react-router-dom";

// ----------------------------------------------------
// 2. LiveDataShowcase Component
// ----------------------------------------------------
function LiveDataShowcase() {
  return (
    <section className="py-20 bg-background relative overflow-hidden border-y border-border/40">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Analytics</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Explore your match data like a pro
          </h2>
          <p className="text-muted-foreground text-lg">
            Stop guessing. See exactly how your squad is performing with interactive heatmaps, tactical insights, and detailed player performance metrics.
          </p>
        </div>

        {/* Dashboard Preview Interface */}
        <div className="max-w-5xl mx-auto bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Mock Header */}
          <div className="bg-muted/40 border-b border-border/80 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
              <div className="h-4 w-[1px] bg-border mx-2" />
              <span className="font-semibold text-sm">Match Analysis Dashboard — Gameweek 18</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-medium border border-emerald-500/20">
                Completed Analysis
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual pitch/heatmap preview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 md:p-6 aspect-[16/10] flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <Activity className="w-4 h-4 text-primary" />
                    Shooting & Shot Map
                  </span>
                  <div className="flex gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-card border border-border">Target Shot</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Goal</span>
                  </div>
                </div>
                
                {/* Mock Football Pitch SVG */}
                <div className="flex-1 border border-dashed border-muted-foreground/30 rounded-lg relative overflow-hidden bg-[#142d1e]/40 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-muted-foreground/20" />
                    <div className="w-36 h-36 border border-muted-foreground/20 rounded-full" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-32 border-r border-y border-muted-foreground/20" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-32 border-l border-y border-muted-foreground/20" />
                  </div>
                  
                  {/* Mock shot points */}
                  <div className="absolute left-[20%] top-[40%] bg-red-500 w-3.5 h-3.5 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse flex items-center justify-center text-[8px] font-bold text-white">G</div>
                  <div className="absolute left-[30%] top-[25%] bg-primary w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <div className="absolute left-[15%] top-[65%] bg-primary w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <div className="absolute left-[45%] top-[50%] bg-primary w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  
                  <span className="text-xs text-muted-foreground/60 absolute bottom-3 left-3">Attack Direction →</span>
                </div>
              </div>

              {/* Match Highlights Statistics Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card p-4 border border-border/60 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Expected Goals (xG)</p>
                  <p className="text-2xl font-bold">2.41 <span className="text-xs font-normal text-muted-foreground">vs 0.84</span></p>
                </div>
                <div className="bg-card p-4 border border-border/60 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Pass Completion %</p>
                  <p className="text-2xl font-bold text-emerald-500">82.4%</p>
                </div>
                <div className="bg-card p-4 border border-border/60 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Possession Lost</p>
                  <p className="text-2xl font-bold text-amber-500">12 <span className="text-xs font-normal text-muted-foreground">in final 3rd</span></p>
                </div>
              </div>
            </div>

            {/* Tactical insights & quick details */}
            <div className="space-y-6">
              <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col justify-between h-full">
                <div>
                  <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Tactical Key Takeaways
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                        +
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Dominant Left Flank Overloads</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Left-back combinations generated 64% of final third entries in the second half.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                        !
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Defensive Transition Vulnerability</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Turnovers in midfield zones led to three high-quality counter-attack opportunities.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                        i
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Set Piece Efficiency</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Corners delivered to the near post yielded 4 shot attempts, resulting in 1 goal.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border/60">
                  <div className="bg-muted/40 p-4 rounded-lg flex items-center gap-3">
                    <Award className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Performer</p>
                      <p className="text-sm font-bold text-foreground">Lars van den Berg</p>
                      <p className="text-xs text-emerald-500 font-medium">9.1 Unified Rating • 2 Assists</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// 3. HowItWorks Component
// ----------------------------------------------------
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Video className="w-6 h-6 text-primary" />,
      title: "Submit Match Link",
      desc: "Paste your match recording from YouTube, Vimeo, Google Drive, or Dropbox. Any public or shared video link works."
    },
    {
      num: "02",
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Professional Tagging",
      desc: "Our football analyst processes your video, tagging every event — passes, possession details, defensive metrics, and shots."
    },
    {
      num: "03",
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
      title: "Interactive Dashboard",
      desc: "Receive an email with your unique dashboard link within 48 hours. Dive deep into tactical maps and individual player ratings."
    }
  ];

  return (
    <section className="py-24 bg-muted/30 relative">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg">
            Get high-level team and player analysis for your squad in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="bg-card border border-border/60 hover:border-primary/40 transition-all rounded-2xl p-8 relative flex flex-col justify-between group">
              <div className="absolute top-6 right-8 text-5xl font-black text-muted/20 select-none group-hover:text-primary/10 transition-colors">
                {step.num}
              </div>
              
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// 5. PricingPreview Component
// ----------------------------------------------------
function PricingPreview() {
  const tiers = [
    {
      name: "Team Essentials",
      price: "$25",
      period: "per match",
      desc: "Perfect for clubs starting with data analytics. Comprehensive team-level stats and maps.",
      features: [
        "Full team-level statistics",
        "Interactive Shot map with details",
        "Possession loss & defensive heatmaps",
        "Interactive match timeline & key phases",
        "Standard 48-hour delivery",
        "Interactive match page"
      ],
      cta: "Submit a Match",
      link: "/submit",
      variant: "outline" as const
    },
    {
      name: "Pro Analytics",
      price: "$100",
      period: "per match",
      desc: "Designed for competitive clubs looking for ultimate player performance tracking.",
      features: [
        "Everything in Team Essentials",
        "Individual ratings for all players",
        "Full player profile pages with season stats",
        "Directional pass maps per player",
        "Zones of control and tactical metrics",
        "Expedited 24-hour delivery priority",
        "Ad-hoc comparison tools between players"
      ],
      cta: "Analyze Match Video",
      link: "/submit?pkg=pro",
      popular: true,
      variant: "default" as const
    }
  ];

  return (
    <section className="py-24 bg-background border-y border-border/40 relative">
      <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Simple, pay-as-you-go pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            No monthly subscription. No long-term lock-in. Pay only for the matches you want analyzed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier, index) => (
            <Card key={index} className={`relative flex flex-col justify-between ${tier.popular ? 'border-primary shadow-lg ring-1 ring-primary/40 bg-card/60' : 'border-border bg-card/35'}`}>
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-semibold text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                  Most Popular Package
                </div>
              )}
              
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-sm mt-2">{tier.desc}</CardDescription>
                
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground font-medium text-sm">/{tier.period}</span>
                </div>
              </CardHeader>

              <CardContent className="px-8 pb-8 pt-0">
                <div className="h-[1px] bg-border mb-6" />
                <ul className="space-y-3.5">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Button asChild size="lg" className="w-full h-12 text-sm font-semibold" variant={tier.variant}>
                  <Link to={tier.link} className="flex items-center justify-center gap-1.5">
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// 6. TestimonialSection Component
// ----------------------------------------------------
function TestimonialSection() {
  const reviews = [
    {
      quote: "Using this match tagging system transformed our post-match analysis. The visual heatmaps and spatial ratings helped our squad clearly visualize tactical mistakes. We've seen a massive spike in set piece execution and passing efficiency since we started analyzing matches here.",
      author: "Marcus Lindemann",
      role: "Head Coach, Glacis United",
      rating: 5,
      avatar: "ML"
    },
    {
      quote: "Before discovering this platform, manual tagging took up 6 to 8 hours of my week. Now, I simply submit the game link and have a fully loaded analytics command center for our players by Monday evening. The visual depth of the maps is phenomenal for this price.",
      author: "Coach Tariq",
      role: "Technical Director, Apex Soccer Academy",
      rating: 5,
      avatar: "CT"
    }
  ];

  return (
    <section className="py-24 bg-muted/30 relative">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Trusted by semi-pro clubs and coaches
          </h2>
          <p className="text-muted-foreground text-lg">
            See how visual analytics and professional tactical feedback elevate performance on pitch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {reviews.map((item, index) => (
            <div key={index} className="bg-card border border-border/60 rounded-2xl p-8 relative shadow-sm flex flex-col justify-between">
              <div className="flex gap-1 mb-5">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-foreground/90 text-base leading-relaxed italic mb-8 relative z-10">
                "{item.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
                  {item.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{item.author}</h4>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// 8. CTABand Component
// ----------------------------------------------------
function CTABand() {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-radial-gradient from-black/20 via-transparent to-transparent opacity-80" />
      <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      
      <div className="container px-4 mx-auto relative z-10 text-center">
        <div className="max-w-3xl mx-auto text-primary-foreground">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Ready to upgrade your tactical game?
          </h2>
          <p className="text-primary-foreground/85 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Submit your next match recording. Get detailed event coding, visual maps, and direct feedback on pitch strategies within 48 hours.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-white text-primary hover:bg-white/90 font-bold transition-all shadow-lg hover:shadow-xl">
              <Link to="/submit" className="flex items-center justify-center gap-2">
                Analyze Your Next Match
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-white/35 text-white hover:bg-white/10 hover:border-white font-semibold transition-all">
              <Link to="/org/glacis-united">
                See Live Analytics Example
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// MAIN Landing Component
// ----------------------------------------------------
export default function Landing() {
  return (
    <MarketingLayout>
      {/* 1. HeroSection (renders immediately, no ScrollReveal) */}
      <HeroSection />

      {/* 2. LiveDataShowcase */}
      <ScrollReveal>
        <LiveDataShowcase />
      </ScrollReveal>

      {/* 3. HowItWorks */}
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>

      {/* 4. StatsCounter */}
      <ScrollReveal>
        <StatsCounter />
      </ScrollReveal>

      {/* 5. PricingPreview */}
      <ScrollReveal>
        <PricingPreview />
      </ScrollReveal>

      {/* 6. TestimonialSection */}
      <ScrollReveal>
        <TestimonialSection />
      </ScrollReveal>

      {/* 7. FAQSection */}
      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>

      {/* 8. CTABand */}
      <ScrollReveal>
        <CTABand />
      </ScrollReveal>
    </MarketingLayout>
  );
}
