import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Home, Search, User, LogIn, Download, Crown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/browse", label: "Browse", icon: Search },
  { path: "/payment", label: "Premium", icon: Crown },
];

const SidebarContent = ({ session, currentPath, onNavigate }: { session: any; currentPath: string; onNavigate?: () => void }) => (
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className="p-4 border-b border-border">
      <Link to="/" className="flex items-center gap-3 font-bold text-xl" onClick={onNavigate}>
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold tracking-tight">
          Up<span className="text-primary">4</span>Down
        </span>
      </Link>
    </div>

    {/* Nav links */}
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path} onClick={onNavigate}>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              currentPath === item.path
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        </Link>
      ))}

      <Link to={session ? "/account" : "/auth"} onClick={onNavigate}>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            (currentPath === "/account" || currentPath === "/auth")
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {session ? <User className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {session ? "Account" : "Login"}
        </button>
      </Link>
    </nav>

    {/* Footer */}
    <div className="p-3 border-t border-border">
      <ThemeToggle />
    </div>
  </div>
);

export const AppSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [session, setSession] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (isMobile) {
    return (
      <>
        <header className="sticky top-0 z-50 glass h-14 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Download className="h-4 w-4 text-primary-foreground" />
            </div>
            Up<span className="text-primary">4</span>Down
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <SidebarContent session={session} currentPath={location.pathname} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>
      </>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-card/50 min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto">
      <SidebarContent session={session} currentPath={location.pathname} />
    </aside>
  );
};
