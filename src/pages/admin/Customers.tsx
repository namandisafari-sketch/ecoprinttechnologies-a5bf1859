import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users, ShoppingCart, DollarSign, Search, Smartphone, Monitor, Tablet, Eye } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: orderStats = {} } = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("user_id, total, status");
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

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["admin-devices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
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
    return (p.full_name || "").toLowerCase().includes(q) || (p.phone || "").toLowerCase().includes(q) || p.user_id.toLowerCase().includes(q);
  });

  const filteredDevices = devices.filter((d: any) => {
    const q = deviceSearch.toLowerCase();
    return (d.full_name || "").toLowerCase().includes(q) || (d.device_type || "").toLowerCase().includes(q) || (d.platform || "").toLowerCase().includes(q);
  });

  const totalUsers = profiles.length;
  const totalCustomersWithOrders = Object.keys(orderStats).length;
  const totalRevenue = Object.values(orderStats).reduce((sum: number, s: any) => sum + s.total, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-foreground">Users & Customers</h1>
        <p className="text-sm text-muted-foreground">All registered users with order analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-2xl font-bold">{totalUsers}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-2xl font-bold">{devices.length}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Devices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-2xl font-bold">{totalCustomersWithOrders}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Buyers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-2xl font-bold truncate">{formatPrice(totalRevenue)}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
          <TabsTrigger value="devices" className="flex-1">Devices ({devices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          {profilesLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((profile: any) => {
                const role = getRoleForUser(profile.user_id);
                const stats = (orderStats as any)[profile.user_id] || { orders: 0, total: 0, delivered: 0 };
                return (
                  <Card key={profile.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">{(profile.full_name || "U").charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{profile.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{profile.phone || "No phone"}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(role) as any} className="capitalize text-[10px]">{role}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-sm font-bold">{stats.orders}</p>
                          <p className="text-[10px] text-muted-foreground">Orders</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-sm font-bold">{stats.delivered}</p>
                          <p className="text-[10px] text-muted-foreground">Delivered</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs font-bold truncate">{stats.total > 0 ? formatPrice(stats.total) : "—"}</p>
                          <p className="text-[10px] text-muted-foreground">Spent</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search devices..." value={deviceSearch} onChange={(e) => setDeviceSearch(e.target.value)} className="pl-10" />
          </div>

          {devicesLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredDevices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDevices.map((device: any) => {
                const DevIcon = getDeviceIcon(device.device_type);
                return (
                  <Card key={device.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedDevice(device)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <DevIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{device.full_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{device.id.slice(0, 8)}...</p>
                        </div>
                        <Badge variant="outline" className="capitalize text-[10px]">{device.device_type || "unknown"}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div><span className="block font-medium text-foreground">{device.platform || "—"}</span>Platform</div>
                        <div><span className="block font-medium text-foreground">{device.screen_width && device.screen_height ? `${device.screen_width}×${device.screen_height}` : "—"}</span>Screen</div>
                        <div><span className="block font-medium text-foreground">{device.connection_type || "—"}</span>Connection</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No devices registered yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Device Detail Dialog */}
      <Dialog open={!!selectedDevice} onOpenChange={(open) => !open && setSelectedDevice(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (() => {
            const DevIcon = getDeviceIcon(selectedDevice.device_type);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <DevIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">{selectedDevice.full_name}</p>
                    <Badge variant="outline" className="capitalize">{selectedDevice.device_type || "unknown"}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Device ID", selectedDevice.id.slice(0, 12) + "..."],
                    ["Fingerprint", selectedDevice.device_fingerprint?.slice(0, 16) + "..."],
                    ["Recovery Code", selectedDevice.recovery_code],
                    ["Platform", selectedDevice.platform],
                    ["Language", selectedDevice.language],
                    ["Screen", selectedDevice.screen_width && selectedDevice.screen_height ? `${selectedDevice.screen_width}×${selectedDevice.screen_height}` : "—"],
                    ["Connection", selectedDevice.connection_type],
                    ["IP Address", selectedDevice.ip_address],
                    ["Registered", selectedDevice.created_at ? format(new Date(selectedDevice.created_at), "PPp") : "—"],
                    ["Last Updated", selectedDevice.updated_at ? format(new Date(selectedDevice.updated_at), "PPp") : "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground text-xs">{label}</p>
                      <p className="font-medium text-foreground break-all">{value || "—"}</p>
                    </div>
                  ))}
                </div>
                {selectedDevice.user_agent && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">User Agent</p>
                    <p className="text-xs text-foreground bg-muted p-2 rounded break-all">{selectedDevice.user_agent}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
