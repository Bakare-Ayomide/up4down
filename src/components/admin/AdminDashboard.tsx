import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminItemForm } from "./AdminItemForm";
import { AdminItemList } from "./AdminItemList";
import { TelegramBotManager } from "./TelegramBotManager";
import { SubscriptionManager } from "./SubscriptionManager";
import { SiteSettingsManager } from "./SiteSettingsManager";
import { PageBuilder } from "./PageBuilder";
import { UserManager } from "./UserManager";
import { RoleManager } from "./RoleManager";
import { SubscriptionCalendar } from "./SubscriptionCalendar";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("items");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingItem(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "items":
        return !showForm ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Manage Downloads</h2>
                <p className="text-muted-foreground text-sm">Add, edit, and manage your download items</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2 shadow-lg w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Add New Item
              </Button>
            </div>
            <AdminItemList key={refreshKey} onEdit={handleEdit} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <AdminItemForm item={editingItem} onSuccess={handleFormSuccess} onCancel={handleCancel} />
          </div>
        );
      case "users":
        return <UserManager />;
      case "subscriptions":
        return <SubscriptionManager />;
      case "calendar":
        return <SubscriptionCalendar />;
      case "pages":
        return <PageBuilder />;
      case "roles":
        return <RoleManager />;
      case "settings":
        return <SiteSettingsManager />;
      case "telegram":
        return <TelegramBotManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Mobile header */}
      {isMobile && (
        <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center justify-between h-14 px-4">
            <span className="font-bold text-lg">Admin</span>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} />
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="shrink-0">
            <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
