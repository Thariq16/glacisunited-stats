import { ReactNode } from "react";
import { MarketingNav } from "../components/MarketingNav";
import { MarketingFooter } from "../components/MarketingFooter";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNav />
      {/* 
        Add mt-16 to offset the fixed height-16 MarketingNav 
        and flex-grow to push footer to bottom 
      */}
      <main className="flex-grow mt-16">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
