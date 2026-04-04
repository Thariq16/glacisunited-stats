import { NavLink } from "@/components/NavLink";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgPath } from "@/hooks/useOrgPath";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { currentOrg } = useOrganization();
  const orgPath = useOrgPath();

  const links = [
    { to: orgPath(""), label: t("nav.home") },
    { to: orgPath("matches"), label: t("nav.matches") },
    { to: orgPath("players"), label: t("nav.players") },
    { to: orgPath("squad-analysis"), label: t("nav.squadAnalysis") },
    { to: orgPath("compare"), label: t("nav.compare") },
  ];

  const displayName = currentOrg?.name || "Football Stats";

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <NavLink to={orgPath("")} className="flex items-center gap-2">
            {currentOrg?.logo_url ? (
              <img src={currentOrg.logo_url} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">⚽</span>
              </div>
            )}
            <span className="font-bold text-xl text-foreground">{displayName}</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === orgPath("")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-foreground"
              >
                {link.label}
              </NavLink>
            ))}
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      activeClassName="text-foreground"
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
