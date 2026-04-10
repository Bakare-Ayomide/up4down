import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileDown, TrendingUp, Users, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface DownloadLog {
  id: string;
  item_id: string | null;
  user_id: string | null;
  user_email: string | null;
  item_title: string;
  created_at: string;
}

type Period = "today" | "week" | "month" | "all";

export const DownloadAnalytics = () => {
  const [logs, setLogs] = useState<DownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("today");
  const [exporting, setExporting] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => { fetchLogs(); }, [period]);

  const getDateFilter = () => {
    const now = new Date();
    if (period === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString();
    } else if (period === "month") {
      const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString();
    }
    return null;
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase.from("download_logs").select("*").order("created_at", { ascending: false }).limit(500);
      const dateFilter = getDateFilter();
      if (dateFilter) query = query.gte("created_at", dateFilter);
      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (e: any) {
      toast.error("Failed to load download logs");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalDownloads = logs.length;
  const uniqueUsers = new Set(logs.filter(l => l.user_email).map(l => l.user_email)).size;
  const topItems = Object.entries(
    logs.reduce((acc, l) => { acc[l.item_title] = (acc[l.item_title] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Daily breakdown
  const dailyBreakdown = Object.entries(
    logs.reduce((acc, l) => {
      const day = new Date(l.created_at).toLocaleDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).slice(0, 14);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const appName = settings.app_settings?.app_name || "Zerolord";
      const periodLabel = period === "today" ? "Today" : period === "week" ? "Last 7 Days" : period === "month" ? "Last 30 Days" : "All Time";

      // Build HTML for PDF
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; background: #fff; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #6C3CE1; }
  .header h1 { font-size: 28px; color: #6C3CE1; margin-bottom: 4px; }
  .header p { color: #666; font-size: 13px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #f8f7ff; border: 1px solid #e8e4f8; border-radius: 12px; padding: 20px; text-align: center; }
  .stat-card .value { font-size: 32px; font-weight: 700; color: #6C3CE1; }
  .stat-card .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 18px; margin-bottom: 12px; color: #1a1a2e; border-left: 4px solid #6C3CE1; padding-left: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #6C3CE1; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #faf9ff; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 2px solid #eee; color: #999; font-size: 11px; }
</style></head><body>
  <div class="header">
    <h1>${appName} — Download Report</h1>
    <p>Period: ${periodLabel} | Generated: ${new Date().toLocaleString()}</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="value">${totalDownloads}</div><div class="label">Total Downloads</div></div>
    <div class="stat-card"><div class="value">${uniqueUsers}</div><div class="label">Unique Users</div></div>
    <div class="stat-card"><div class="value">${topItems.length > 0 ? topItems[0][1] : 0}</div><div class="label">Top Item Downloads</div></div>
  </div>
  <div class="section">
    <h2>Top Downloaded Items</h2>
    <table><tr><th>#</th><th>Item</th><th>Downloads</th></tr>
    ${topItems.map(([title, count], i) => `<tr><td>${i + 1}</td><td>${title}</td><td>${count}</td></tr>`).join("")}
    ${topItems.length === 0 ? "<tr><td colspan='3' style='text-align:center;color:#999'>No data</td></tr>" : ""}
    </table>
  </div>
  <div class="section">
    <h2>Daily Breakdown</h2>
    <table><tr><th>Date</th><th>Downloads</th></tr>
    ${dailyBreakdown.map(([day, count]) => `<tr><td>${day}</td><td>${count}</td></tr>`).join("")}
    ${dailyBreakdown.length === 0 ? "<tr><td colspan='2' style='text-align:center;color:#999'>No data</td></tr>" : ""}
    </table>
  </div>
  <div class="section">
    <h2>Recent Downloads (up to 100)</h2>
    <table><tr><th>Date</th><th>User</th><th>Item</th></tr>
    ${logs.slice(0, 100).map(l => `<tr><td>${new Date(l.created_at).toLocaleString()}</td><td>${l.user_email || "Anonymous"}</td><td>${l.item_title}</td></tr>`).join("")}
    ${logs.length === 0 ? "<tr><td colspan='3' style='text-align:center;color:#999'>No data</td></tr>" : ""}
    </table>
  </div>
  <div class="footer">${appName} &copy; ${new Date().getFullYear()} — Confidential Report</div>
</body></html>`;

      // Use browser print-to-PDF
      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("Please allow popups to export PDF"); return; }
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
      toast.success("PDF export opened — use Print > Save as PDF");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const periodLabels: Record<Period, string> = { today: "Today", week: "Last 7 Days", month: "Last 30 Days", all: "All Time" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Download Analytics</h2>
          <p className="text-muted-foreground">Track downloads, users, and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportPDF} disabled={exporting} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-3xl font-bold">{totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-3xl font-bold">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Downloaded</p>
                <p className="text-lg font-bold truncate max-w-[160px]">{topItems[0]?.[0] || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Top Downloads</CardTitle></CardHeader>
        <CardContent>
          {topItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No downloads in this period</p>
          ) : (
            <div className="space-y-3">
              {topItems.map(([title, count], i) => (
                <div key={title} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold">{i + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{title}</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(count / (topItems[0]?.[1] || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="font-bold text-primary">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Daily Breakdown</CardTitle></CardHeader>
        <CardContent>
          {dailyBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data</p>
          ) : (
            <div className="space-y-2">
              {dailyBreakdown.map(([day, count]) => (
                <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{day}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / (dailyBreakdown[0]?.[1] || 1)) * 100}%` }} />
                    </div>
                    <span className="font-semibold text-sm w-10 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs Table */}
      <Card>
        <CardHeader><CardTitle>Recent Downloads</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No downloads recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{log.user_email || <span className="text-muted-foreground">Anonymous</span>}</TableCell>
                      <TableCell className="font-medium text-sm">{log.item_title}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
