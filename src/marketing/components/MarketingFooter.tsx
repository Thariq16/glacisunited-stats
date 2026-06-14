import { Link } from "react-router-dom";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  const links = [
    { to: "/demo", label: "Demo" },
    { to: "/pricing", label: "Pricing" },
    { to: "/clubs", label: "Clubs" },
    { to: "/submit", label: "Submit a Match" },
    { to: "/login", label: "Log In" },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + Name Left */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">⚽</span>
            </div>
            <span className="font-semibold text-sm text-foreground">FootyMetrics</span>
          </div>

          {/* Links Center */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright Right */}
          <div className="text-xs text-muted-foreground text-center md:text-right">
            © {currentYear} FootyMetrics. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
