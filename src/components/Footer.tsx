import { Link, useNavigate } from "react-router-dom";
import { Users, Home, Calendar, LogOut, LogIn, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/matches', label: t('nav.matches'), icon: Calendar },
    { to: '/seasons', label: t('nav.seasons'), icon: Trophy },
    { to: '/opposition-players', label: t('nav.oppositionPlayers'), icon: Users },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard', icon: Shield },
    { to: '/admin/players', label: 'Player Management', icon: UserCog },
    { to: '/admin/upload', label: 'Data Import', icon: Upload },
    { to: '/admin/match-upload', label: 'Match Upload', icon: FileUp },
  ];

  return (
    <footer className="mt-auto bg-muted/30 border-t border-border">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t('footer.navigation')}</h4>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {isAdmin && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t('footer.admin')}</h4>
              <ul className="space-y-2">
                {adminLinks.map(link => (
                  <li key={link.to}>
                    <Link to={link.to} className="flex items-center gap-2 text-sm text-primary/80 hover:text-primary transition-colors">
                      <link.icon className="h-3.5 w-3.5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={isAdmin ? '' : 'md:col-start-3'}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t('footer.account')}</h4>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-0">
                <LogOut className="h-3.5 w-3.5" />
                {t('footer.logOut')}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-0">
                <LogIn className="h-3.5 w-3.5" />
                {t('footer.logIn')}
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('footer.analysisBy')}{" "}
          <a href="https://www.linkedin.com/in/thariqhamad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-colors">
            Thariq Hamad
          </a>
        </div>
      </div>
    </footer>
  );
}
