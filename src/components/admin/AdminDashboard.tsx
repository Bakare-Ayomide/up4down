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
import { NewsManager } from "./NewsManager";
import { CategoryManager } from "./CategoryManager";
import { AdManager } from "./AdManager";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("items");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Manage Downloads</h2>
                <p className="text-muted-foreground">Add, edit, and manage your download items</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2 shadow-lg">
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
      case "categories":
        return <CategoryManager />;
      case "news":
        return <NewsManager />;
      case "ads":
        return <AdManager />;
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
      <nav className="lg:hidden border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between h-14 px-4">
          <span className="font-bold text-lg">Admin</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-border p-2">
            <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} />
          </div>
        )}
      </nav>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
