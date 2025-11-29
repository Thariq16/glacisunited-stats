import { Link } from "react-router-dom";
import { Users, Home, Calendar, Shield, UserCog, Upload, FileUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const { isAdmin } = useAuth();

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

        {isAdmin && (
          <>
            <div className="w-full border-t border-border my-4" />
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
              <Link 
                to="/admin/players" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <UserCog className="h-4 w-4" />
                Player Management
              </Link>
              <Link 
                to="/admin/upload" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Data Import
              </Link>
              <Link 
                to="/admin/match-upload" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <FileUp className="h-4 w-4" />
                Match Upload
              </Link>
            </div>
          </>
        )}

        <div className="text-center mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Analysis by Thariq Hamad
        </div>
      </div>
    </footer>
  );
}
