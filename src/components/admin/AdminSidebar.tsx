import { LayoutGrid, Crown, FileText, Sliders, Bot, Users, CalendarDays, LogOut, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: "items", label: "Downloads", icon: LayoutGrid },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: Crown },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "roles", label: "Roles", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: Sliders },
  { id: "telegram", label: "Bots", icon: Bot },
];

export const AdminSidebar = ({ activeTab, onTabChange, onLogout }: AdminSidebarProps) => {
  return (
    <aside className="lg:w-64 lg:border-r border-border lg:bg-card/50 lg:min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b border-border hidden lg:block">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border hidden lg:block">
        <Button variant="ghost" onClick={onLogout} className="w-full justify-start gap-3 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
