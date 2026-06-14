import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ScrollReveal";
import { MarketingLayout } from "../layouts/MarketingLayout";
import { Linkedin, Mail, ExternalLink, Calendar, Database, Target, Award } from "lucide-react";

export default function About() {
  return (
    <MarketingLayout>
      <div className="bg-background text-foreground min-h-screen py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          
          {/* 1. INTRO SECTION */}
          <ScrollReveal animation="fade-up" className="mb-16 md:mb-24 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Meet the Founder
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
              Thariq Hamad
            </h1>
            <p className="text-xl md:text-2xl text-primary font-medium mb-8">
              Football analyst, developer, and the person behind FootyMetrics
            </p>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                I'm a football fan who got frustrated that semi-professional clubs have almost no access to the kind of data analysis that professional clubs take for granted. I built FootyMetrics to change that. I personally tag every match event — every pass, shot, tackle, and aerial — so the data is accurate and the dashboard is genuinely useful for coaches.
              </p>
            </div>
          </ScrollReveal>

          {/* Grid Layout for Why I Built This & Technical Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-16 md:mb-24">
            
            {/* 2. WHY I BUILT THIS SECTION */}
            <ScrollReveal animation="fade-up" delay={100}>
              <div className="h-full flex flex-col p-6 md:p-8 rounded-2xl bg-muted/30 border border-border/50">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Why I built this
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Most football analytics platforms are built for professional clubs with large budgets. Semi-pro and amateur clubs are left with spreadsheets and gut feelings. I wanted to build something that brings professional-quality analysis to clubs at any level — at a price that actually makes sense.
                </p>
              </div>
            </ScrollReveal>

            {/* 3. HOW IT WORKS TECHNICALLY SECTION */}
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="h-full flex flex-col p-6 md:p-8 rounded-2xl bg-muted/30 border border-border/50">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Database className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  How the analysis works
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Every match is tagged at the event level. That means every pass, shot, tackle, aerial duel, and set piece is logged with a pitch coordinate, a timestamp, a player, and an outcome. From those raw events, the platform calculates every stat you see in the dashboard — including zone-based metrics, which require handling the direction each team attacks in each half so that "defensive third" always means the right end of the pitch regardless of which way the teams lined up.
                </p>
              </div>
            </ScrollReveal>

          </div>

          {/* 4. WHAT I'M LOOKING FOR SECTION */}
          <ScrollReveal animation="fade-up" className="mb-16 md:mb-24">
            <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-muted/20 border border-primary/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block">
                <Award className="h-40 w-40 text-primary" />
              </div>
              
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                  What I'm looking for
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  I'm building FootyMetrics as a side project while looking for a full-time role in football analytics, sports technology, or data engineering. If you work in this space and want to talk, I'd genuinely love to connect.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="gap-2">
                    <a href="https://www.linkedin.com/in/thariqhamad" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-5 w-5" />
                      Connect on LinkedIn
                      <ExternalLink className="h-4 w-4 opacity-50" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="gap-2">
                    <a href="mailto:thariq@footymetrics.com">
                      <Mail className="h-5 w-5" />
                      Get in touch by email
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* 5. FOOTER NOTE */}
          <ScrollReveal animation="fade-up" className="border-t border-border/60 pt-8 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              FootyMetrics is a one-person side project. Every match is personally analysed by me. If you're a club interested in getting your data tracked, visit the{" "}
              <Link to="/submit" className="text-primary hover:underline font-semibold">
                Submit page
              </Link>
              .
            </p>
          </ScrollReveal>

        </div>
      </div>
    </MarketingLayout>
  );
}