import { Link } from "react-router-dom";
import { Users, Home, Calendar } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link 
            to="/matches" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Matches
          </Link>
          <Link 
            to="/opposition-players" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            Opposition Players
          </Link>
        </div>
        <div className="text-center mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Analysis by Thariq Hamad
        </div>
      </div>
    </footer>
  );
}
