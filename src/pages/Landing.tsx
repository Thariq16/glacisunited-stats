import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Match Analytics',
    description:
      'Track every pass, shot, and tackle with detailed per-match breakdowns and visualizations.',
  },
  {
    icon: Target,
    title: 'Shot & xG Maps',
    description:
      'Visualize shot locations and expected goals to understand finishing quality at a glance.',
  },
  {
    icon: Users,
    title: 'Squad Management',
    description:
      'Manage rosters, compare players side-by-side, and identify your strongest lineup.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Trends',
    description:
      'Monitor player form over multiple matches with trend charts and consistency metrics.',
  },
  {
    icon: Shield,
    title: 'Defensive Analysis',
    description:
      'Heatmaps and event tracking for tackles, clearances, and possession loss zones.',
  },
  {
    icon: Zap,
    title: 'Set Piece Intelligence',
    description:
      'Analyse corner, free-kick, and throw-in effectiveness with retention and zone data.',
  },
];

const benefits = [
  'Real-time data entry during matches',
  'Coach & player-specific dashboards',
  'Multi-team & multi-season support',
  'CSV import for historical data',
  'Secure, role-based access control',
  'Works on desktop, tablet & mobile',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <span className="text-xl font-bold tracking-tight text-primary">
            ⚽ FootballStats
          </span>
          <div className="flex items-center gap-3">
            <Link to="/demo">
              <Button variant="ghost" size="sm">
                Live Demo
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Sign In <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-block mb-4 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            Built for grassroots & semi-pro clubs
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Professional-grade{' '}
            <span className="text-primary">football analytics</span> for every
            club
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Give your coaching staff the data they need to make smarter
            decisions — from match-day insights to long-term player development.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="text-base px-8">
                Get Started Free
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-base px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold md:text-4xl">
              Everything you need to analyse your team
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Powerful tools designed for coaches, analysts, and players at
              every level of the game.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-14">
          <div className="flex-1">
            <h2 className="text-3xl font-bold md:text-4xl mb-4">
              Why clubs choose us
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              We handle the complexity so you can focus on winning. Set up in
              minutes, not months.
            </p>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {[
              { label: 'Matches Tracked', value: '2,400+' },
              { label: 'Clubs Onboarded', value: '65+' },
              { label: 'Events Logged', value: '180K+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((s) => (
              <Card key={s.label} className="border-border/50">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-extrabold text-primary">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl mb-4">
            Ready to level up your analysis?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Create your club account in under two minutes. No credit card
            required.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-base px-10">
              Start Free Today <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FootballStats. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/demo" className="hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
