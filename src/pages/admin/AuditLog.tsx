import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Activity, Shield, User } from "lucide-react";
import { format } from "date-fns";

const actionColor = (a: string) => {
  if (a === "create") return "default";
  if (a === "update") return "secondary";
  if (a === "delete" || a === "reject") return "destructive";
  if (a === "approve") return "outline";
  return "secondary";
};

const AuditLog = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", search, actionFilter, entityFilter, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (search) q = q.or(`description.ilike.%${search}%,user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
      if (actionFilter !== "all") q = q.eq("action", actionFilter);
      if (entityFilter !== "all") q = q.eq("entity_type", entityFilter);
      if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);
      const { data } = await q;
      return data || [];
    },
  });

  const entityTypes = Array.from(new Set(logs.map((l: any) => l.entity_type))) as string[];
  const todayCount = logs.filter((l: any) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const uniqueUsers = new Set(logs.map((l: any) => l.user_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track every action performed in the admin panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Activity className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">{todayCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{uniqueUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by user, description..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="print">Print</SelectItem>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="reject">Reject</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No audit records yet. Actions will appear here as staff use the system.</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={actionColor(log.action) as any} className="capitalize">{log.action}</Badge>
                        <Badge variant="outline" className="capitalize">{log.entity_type}</Badge>
                        {log.entity_id && (
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">#{log.entity_id}</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{log.description || `${log.action} ${log.entity_type}`}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{log.user_name || log.user_email || "Unknown"}</span>
                        {" • "}
                        {format(new Date(log.created_at), "MMM dd, yyyy • HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
