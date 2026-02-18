import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Crown, User, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  subscription_status?: string;
  expires_at?: string | null;
  is_admin?: boolean;
}

export const UserManager = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch active subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, status, expires_at")
      .in("status", ["active", "pending"]);

    // Fetch admin roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    const subsMap = new Map(subs?.map(s => [s.user_id, s]) || []);
    const adminSet = new Set(roles?.map(r => r.user_id) || []);

    const enriched = (profiles || []).map(p => ({
      ...p,
      subscription_status: subsMap.get(p.user_id)?.status || "free",
      expires_at: subsMap.get(p.user_id)?.expires_at || null,
      is_admin: adminSet.has(p.user_id),
    }));

    setUsers(enriched);
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast.success("Admin role removed");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      toast.success("Admin role granted");
    }
    fetchUsers();
  };

  const deleteUser = async () => {
    if (!deleteId) return;
    // Delete profile (subscription cascade not set, so delete manually)
    await supabase.from("subscriptions").delete().eq("user_id", deleteId);
    await supabase.from("user_roles").delete().eq("user_id", deleteId);
    await supabase.from("profiles").delete().eq("user_id", deleteId);
    toast.success("User data deleted");
    setDeleteId(null);
    fetchUsers();
  };

  const filtered = users.filter(u =>
    search
      ? (u.email?.toLowerCase().includes(search.toLowerCase()) ||
         u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
         u.user_id.includes(search))
      : true
  );

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      free: "bg-muted text-muted-foreground border-border",
    };
    return <Badge className={colors[status] || colors.free}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Users</h2>
          <p className="text-muted-foreground">{users.length} total users</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by email, name, or user ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-3">
          {filtered.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {user.is_admin ? <ShieldCheck className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{user.email || "No email"}</span>
                      {user.is_admin && <Badge variant="outline" className="text-primary border-primary/30 text-xs">ADMIN</Badge>}
                      {statusBadge(user.subscription_status || "free")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {user.user_id.slice(0, 12)}... · Joined: {new Date(user.created_at).toLocaleDateString()}
                      {user.expires_at && ` · Expires: ${new Date(user.expires_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={user.is_admin ? "destructive" : "outline"}
                    onClick={() => toggleAdmin(user.user_id, !!user.is_admin)}
                    className="gap-1 text-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {user.is_admin ? "Remove Admin" : "Make Admin"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(user.user_id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No users found</div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user data?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the user's profile, subscriptions, and roles. The auth account will remain.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
