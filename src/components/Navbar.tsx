import { NavLink } from "@/components/NavLink";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useOrganization } from "@/hooks/useOrganization";
export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { currentOrg } = useOrganization();
  const displayName = currentOrg?.name ? `${currentOrg.name} Stats` : 'Football Stats';
  return <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">⚽</span>
            </div>
            <span className="font-bold text-xl text-foreground">{displayName}</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
              Home
            </NavLink>
            <NavLink to="/matches" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
              Matches
            </NavLink>
            <NavLink to="/players" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
              Players
            </NavLink>
            <NavLink to="/squad-analysis" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
              Squad Analysis
            </NavLink>
            <NavLink to="/compare" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
              Compare
            </NavLink>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle dark mode">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle dark mode">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <NavLink to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
                    Home
                  </NavLink>
                  <NavLink to="/matches" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
                    Matches
                  </NavLink>
                  <NavLink to="/players" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
                    Players
                  </NavLink>
                  <NavLink to="/squad-analysis" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
                    Squad Analysis
                  </NavLink>
                  <NavLink to="/compare" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground">
                    Compare
                  </NavLink>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>;
}