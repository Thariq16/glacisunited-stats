import { NavLink } from "@/components/NavLink";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">⚽</span>
            </div>
            <span className="font-bold text-xl text-foreground">Football Stats</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground"
            >
              Home
            </NavLink>
            <NavLink 
              to="/team/europa-point" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground"
            >
              Europa Point FC
            </NavLink>
            <NavLink 
              to="/team/glacis-united" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground"
            >
              Glacis United
            </NavLink>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                <NavLink 
                  to="/" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-foreground"
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/team/europa-point" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-foreground"
                >
                  Europa Point FC
                </NavLink>
                <NavLink 
                  to="/team/glacis-united" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeClassName="text-foreground"
                >
                  Glacis United
                </NavLink>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
