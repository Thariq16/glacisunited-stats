import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/demo", label: "Demo" },
    { to: "/clubs", label: "Clubs" },
    { to: "/pricing", label: "Pricing" },
    { to: "/about", label: "About" },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const logoMarkup = (
    <Link to="/" className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">⚽</span>
      </div>
      <span className="font-bold text-xl text-foreground">FootyMetrics</span>
    </Link>
  );

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent h-16 flex items-center bg-transparent",
        isScrolled && "bg-background/95 backdrop-blur-md shadow-md border-border"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 w-full">
        <div className="flex items-center justify-between">
          {/* Logo Left */}
          <div className="flex-shrink-0">{logoMarkup}</div>

          {/* Desktop: Links Center */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                    isActive && "font-semibold text-primary"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop Actions Right */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-sm font-medium"
            >
              Log In
            </Button>
            <Button onClick={() => navigate("/submit")}>
              Submit a Match
            </Button>
          </div>

          {/* Mobile: Actions + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Button size="sm" onClick={() => navigate("/submit")}>
              Submit a Match
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Logo inside mobile menu */}
                  <div className="pb-4 border-b border-border">{logoMarkup}</div>

                  <div className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          cn(
                            "text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1",
                            isActive && "font-semibold text-primary"
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                    <NavLink
                      to="/login"
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        cn(
                          "text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1",
                          isActive && "font-semibold text-primary"
                        )
                      }
                    >
                      Log In
                    </NavLink>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
