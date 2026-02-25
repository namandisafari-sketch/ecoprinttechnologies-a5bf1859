import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Users, ShoppingCart, DollarSign, Search, UserPlus, Smartphone, Monitor, Tablet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");

  // Fetch all registered users from profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user roles
  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch order analytics per user
  const { data: orderStats = {} } = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("user_id, total, status");
      if (error) throw error;

      const stats: Record<string, { orders: number; total: number; delivered: number }> = {};
      data?.forEach((order) => {
        if (!order.user_id) return;
        if (!stats[order.user_id]) stats[order.user_id] = { orders: 0, total: 0, delivered: 0 };
        stats[order.user_id].orders++;
        stats[order.user_id].total += Number(order.total);
        if (order.status === "delivered") stats[order.user_id].delivered++;
      });
      return stats;
    },
  });

  // Fetch all devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["admin-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getDeviceIcon = (type: string | null) => {
    if (type === "mobile") return Smartphone;
    if (type === "tablet") return Tablet;
    return Monitor;
  };

  const getRoleForUser = (userId: string) => {
    const userRoles = roles.filter((r: any) => r.user_id === userId);
    if (userRoles.length === 0) return "customer";
    if (userRoles.some((r: any) => r.role === "admin")) return "admin";
    if (userRoles.some((r: any) => r.role === "manager")) return "manager";
    if (userRoles.some((r: any) => r.role === "seller")) return "seller";
    return "customer";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "manager": return "default";
      case "seller": return "secondary";
      default: return "outline";
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(price);

  const filtered = profiles.filter((p: any) => {
    const q = search.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q)
    );
  });

  const filteredDevices = devices.filter((d: any) => {
    const q = deviceSearch.toLowerCase();
    return (
      (d.full_name || "").toLowerCase().includes(q) ||
      (d.device_type || "").toLowerCase().includes(q) ||
      (d.platform || "").toLowerCase().includes(q) ||
      (d.ip_address || "").toLowerCase().includes(q)
    );
  });

  const totalUsers = profiles.length;
  const totalCustomersWithOrders = Object.keys(orderStats).length;
  const totalRevenue = Object.values(orderStats).reduce((sum: number, s: any) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Users & Customers</h1>
        <p className="text-muted-foreground">All registered users with order analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Registered Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{devices.length}</p>
              <p className="text-xs text-muted-foreground">Devices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCustomersWithOrders}</p>
              <p className="text-xs text-muted-foreground">Buyers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Registered Users</TabsTrigger>
          <TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-lg">All Users ({filtered.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {profilesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Orders</TableHead>
                        <TableHead className="text-right">Total Spent</TableHead>
                        <TableHead className="text-center">Delivered</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((profile: any) => {
                        const role = getRoleForUser(profile.user_id);
                        const stats = (orderStats as any)[profile.user_id] || { orders: 0, total: 0, delivered: 0 };
                        return (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-primary">{(profile.full_name || "U").charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{profile.full_name || "Unnamed"}</p>
                                  <p className="text-xs text-muted-foreground">{profile.phone || "No phone"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant={getRoleBadgeVariant(role) as any} className="capitalize">{role}</Badge></TableCell>
                            <TableCell className="text-center">{stats.orders}</TableCell>
                            <TableCell className="text-right font-medium">{stats.total > 0 ? formatPrice(stats.total) : "—"}</TableCell>
                            <TableCell className="text-center">{stats.delivered}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, device type, platform, or IP..." value={deviceSearch} onChange={(e) => setDeviceSearch(e.target.value)} className="pl-10" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-lg">All Devices ({filteredDevices.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {devicesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredDevices.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Screen</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Connection</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDevices.map((device: any) => {
                        const DevIcon = getDeviceIcon(device.device_type);
                        return (
                          <TableRow key={device.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <DevIcon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{device.full_name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{device.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{device.device_type || "unknown"}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{device.platform || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {device.screen_width && device.screen_height ? `${device.screen_width}×${device.screen_height}` : "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{device.language || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{device.connection_type || "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No devices registered yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCustomers;
