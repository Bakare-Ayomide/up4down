import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, LayoutGrid, Bot, Settings, Crown, Sliders } from "lucide-react";
import { AdminItemForm } from "./AdminItemForm";
import { AdminItemList } from "./AdminItemList";
import { TelegramBotManager } from "./TelegramBotManager";
import { SubscriptionManager } from "./SubscriptionManager";
import { SiteSettingsManager } from "./SiteSettingsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Admin Panel
              </h1>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
            <TabsTrigger value="items" className="gap-1 text-xs sm:text-sm">
              <LayoutGrid className="h-4 w-4" />
              Downloads
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1 text-xs sm:text-sm">
              <Crown className="h-4 w-4" />
              Subs
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 text-xs sm:text-sm">
              <Sliders className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="telegram" className="gap-1 text-xs sm:text-sm">
              <Bot className="h-4 w-4" />
              Bots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-6">
            {!showForm ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Manage Downloads</h2>
                    <p className="text-muted-foreground">Add, edit, and manage your download items</p>
                  </div>
                  <Button onClick={() => setShowForm(true)} className="gap-2 shadow-lg">
                    <Plus className="h-4 w-4" />
                    Add New Item
                  </Button>
                </div>

                <AdminItemList key={refreshKey} onEdit={handleEdit} />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <AdminItemForm
                  item={editingItem}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancel}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettingsManager />
          </TabsContent>

          <TabsContent value="telegram">
            <TelegramBotManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
