import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

export const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Up4Down
            </span>
          </Link>

          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "secondary" : "ghost"} 
                size="sm"
                className="font-medium"
              >
                Home
              </Button>
            </Link>
            <Link to="/browse">
              <Button 
                variant={location.pathname === "/browse" ? "secondary" : "ghost"} 
                size="sm"
                className="font-medium"
              >
                Browse
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
