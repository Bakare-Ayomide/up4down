import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RoleEntry {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

export const RoleManager = () => {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (roleData) {
      // Get emails from profiles
      const userIds = roleData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
      setRoles(roleData.map(r => ({ ...r, email: emailMap.get(r.user_id) || "Unknown" })));
    }
    setLoading(false);
  };

  const addAdmin = async () => {
    if (!newEmail) { toast.error("Enter an email"); return; }
    setAdding(true);

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", newEmail.trim())
      .maybeSingle();

    if (!profile) {
      toast.error("User not found. They must create an account first.");
      setAdding(false);
      return;
    }

    // Check if already admin
    const exists = roles.find(r => r.user_id === profile.user_id && r.role === "admin");
    if (exists) {
      toast.error("User is already an admin");
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: profile.user_id,
      role: "admin",
    });

    if (error) toast.error(error.message);
    else {
      toast.success(`${newEmail} is now an admin`);
      setNewEmail("");
      fetchRoles();
    }
    setAdding(false);
  };

  const removeRole = async (id: string) => {
    await supabase.from("user_roles").delete().eq("id", id);
    toast.success("Role removed");
    fetchRoles();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Manage Admin Roles</h2>
        <p className="text-muted-foreground">Grant or revoke admin access</p>
      </div>

      <Card className="p-6 space-y-4">
        <Label>Add new admin by email</Label>
        <div className="flex gap-3">
          <Input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1"
          />
          <Button onClick={addAdmin} disabled={adding} className="gap-2">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Admin
          </Button>
        </div>
      </Card>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-3">
          {roles.map((role) => (
            <Card key={role.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{role.email}</span>
                    <Badge className="ml-2 text-xs" variant="outline">{role.role.toUpperCase()}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeRole(role.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
          {roles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No roles assigned</div>
          )}
        </div>
      )}
    </div>
  );
};
