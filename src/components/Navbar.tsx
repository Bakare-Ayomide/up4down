import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Menu, X, User, LogIn } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 font-bold text-xl group">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:animate-pulse-glow transition-all duration-300 bg-destructive">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline font-bold tracking-tight">ZEROLORD
              <span className="text-primary">4</span>Down
            </span>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
                className={`font-medium rounded-full px-5 ${location.pathname === "/" ? "shadow-[var(--shadow-glow)]" : ""}`}>
                
                Home
              </Button>
            </Link>
            <Link to="/browse">
              <Button
                variant={location.pathname === "/browse" ? "default" : "ghost"}
                size="sm"
                className={`font-medium rounded-full px-5 ${location.pathname === "/browse" ? "shadow-[var(--shadow-glow)]" : ""}`}>
                
                Browse
              </Button>
            </Link>
            <Link to={session ? "/account" : "/auth"}>
              <Button
                variant={location.pathname === "/auth" || location.pathname === "/account" ? "default" : "ghost"}
                size="sm"
                className={`font-medium rounded-full px-5 ${location.pathname === "/auth" || location.pathname === "/account" ? "shadow-[var(--shadow-glow)]" : ""}`}>
                
                {session ? <User className="h-4 w-4 mr-1" /> : <LogIn className="h-4 w-4 mr-1" />}
                {session ? "Account" : "Login"}
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-9 w-9">
              
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen &&
        <div className="md:hidden py-4 border-t border-border/50 space-y-4">
            <SearchBar />
            <div className="flex gap-2">
              <Link to="/" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button
                variant={location.pathname === "/" ? "default" : "outline"}
                className="w-full rounded-xl">
                
                  Home
                </Button>
              </Link>
              <Link to="/browse" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button
                variant={location.pathname === "/browse" ? "default" : "outline"}
                className="w-full rounded-xl">
                
                  Browse
                </Button>
              </Link>
              <Link to={session ? "/account" : "/auth"} className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button
                variant={location.pathname === "/auth" || location.pathname === "/account" ? "default" : "outline"}
                className="w-full rounded-xl">
                
                  {session ? "Account" : "Login"}
                </Button>
              </Link>
            </div>
          </div>
        }
      </div>
    </nav>);

};