import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, LogIn, LogOut, Clock, AlertCircle, CheckCircle2, Loader2, Settings } from "lucide-react";
import { format } from "date-fns";
import { useStoreLocation } from "@/hooks/useStoreLocation";

// Haversine formula in meters
const distanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Attendance = () => {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { data: store } = useStoreLocation();
  const [pos, setPos] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [radiusInput, setRadiusInput] = useState("150");

  const { data: geofence } = useQuery({
    queryKey: ["attendance_geofence"],
    queryFn: async () => {
      const { data } = await supabase.from("store_settings").select("value").eq("key", "attendance_geofence").maybeSingle();
      const v = (data?.value as any) || { radius_meters: 150 };
      return v;
    },
  });

  useEffect(() => {
    if (geofence) setRadiusInput(String(geofence.radius_meters || 150));
  }, [geofence]);

  const radius = Number(geofence?.radius_meters) || 150;

  const { data: today = [] } = useQuery({
    queryKey: ["attendance-today", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("check_in_at", start.toISOString())
        .order("check_in_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: allRecords = [] } = useQuery({
    queryKey: ["attendance-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .order("check_in_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: isAdmin,
  });

  const openShift = today.find((r: any) => !r.check_out_at);

  const getLocation = (): Promise<{ lat: number; lng: number; acc: number }> => {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
        (e) => rej(new Error(e.message)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const checkIn = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!store) throw new Error("Store location not set");
      setLoading(true);
      const p = await getLocation();
      setPos(p);
      const dist = distanceMeters(p.lat, p.lng, store.lat, store.lng);
      if (dist > radius) {
        throw new Error(`You are ${Math.round(dist)}m from the shop. You must be within ${radius}m to check in.`);
      }
      const { error } = await supabase.from("attendance_records").insert({
        user_id: user.id,
        full_name: user.email,
        check_in_lat: p.lat,
        check_in_lng: p.lng,
        distance_meters: Math.round(dist),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
      qc.invalidateQueries({ queryKey: ["attendance-all"] });
      toast.success("Checked in!");
      setLoading(false);
    },
    onError: (e: any) => { toast.error(e.message); setLoading(false); },
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      if (!openShift) return;
      setLoading(true);
      const p = await getLocation();
      setPos(p);
      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out_at: new Date().toISOString(),
          check_out_lat: p.lat,
          check_out_lng: p.lng,
        })
        .eq("id", openShift.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-today"] });
      qc.invalidateQueries({ queryKey: ["attendance-all"] });
      toast.success("Checked out!");
      setLoading(false);
    },
    onError: (e: any) => { toast.error(e.message); setLoading(false); },
  });

  const saveRadius = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("store_settings")
        .update({ value: { radius_meters: Number(radiusInput) || 150 } as any })
        .eq("key", "attendance_geofence");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance_geofence"] });
      toast.success("Geofence radius saved");
    },
  });

  const liveDist = pos && store ? Math.round(distanceMeters(pos.lat, pos.lng, store.lat, store.lng)) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-6 w-6" /> Attendance</h1>
        <p className="text-sm text-muted-foreground">Check in and out only when you're at the shop</p>
      </div>

      {!store && (
        <Card>
          <CardContent className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
            <p className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" /> Store location not configured. Admin must set it under Store Location.</p>
          </CardContent>
        </Card>
      )}

      {/* Check-in card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="font-semibold">{format(new Date(), "EEEE, MMM dd")}</p>
            </div>
            <Badge className={openShift ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-muted"} variant="outline">
              {openShift ? "On shift" : "Off shift"}
            </Badge>
          </div>

          {store && (
            <div className="text-sm bg-muted/50 rounded p-3 space-y-1">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Shop: <strong>{store.label}</strong></p>
              <p className="text-xs text-muted-foreground">Allowed radius: {radius}m</p>
              {liveDist !== null && (
                <p className={`text-xs flex items-center gap-1 ${liveDist <= radius ? "text-emerald-600" : "text-destructive"}`}>
                  {liveDist <= radius ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  You are {liveDist}m from the shop {liveDist <= radius ? "(in range ✓)" : "(out of range)"}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {!openShift ? (
              <Button size="lg" onClick={() => checkIn.mutate()} disabled={loading || !store}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Check In
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={() => checkOut.mutate()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Check Out
              </Button>
            )}
          </div>

          {openShift && (
            <p className="text-sm text-muted-foreground">
              Checked in at <strong>{format(new Date(openShift.check_in_at), "p")}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's history */}
      {today.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-semibold mb-3">Today's shifts</p>
            <div className="space-y-2">
              {today.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <span>{format(new Date(r.check_in_at), "p")} → {r.check_out_at ? format(new Date(r.check_out_at), "p") : "Open"}</span>
                  <Badge variant="outline" className="text-xs">{r.distance_meters ?? "?"}m</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: settings + all records */}
      {isAdmin && (
        <>
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold flex items-center gap-2"><Settings className="h-4 w-4" /> Geofence Settings (Admin)</p>
              <div className="flex items-end gap-2">
                <div className="flex-1 max-w-xs">
                  <Label>Allowed radius (meters)</Label>
                  <Input type="number" value={radiusInput} onChange={(e) => setRadiusInput(e.target.value)} />
                </div>
                <Button onClick={() => saveRadius.mutate()} disabled={saveRadius.isPending}>Save</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="font-semibold mb-3">All Staff Attendance (latest 100)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-2">Staff</th>
                      <th className="p-2">Check-in</th>
                      <th className="p-2">Check-out</th>
                      <th className="p-2">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRecords.map((r: any) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2">{r.full_name || r.user_id.slice(0, 8)}</td>
                        <td className="p-2">{format(new Date(r.check_in_at), "MMM dd, p")}</td>
                        <td className="p-2">{r.check_out_at ? format(new Date(r.check_out_at), "MMM dd, p") : <Badge variant="outline">Open</Badge>}</td>
                        <td className="p-2 text-xs">{r.distance_meters ?? "?"}m</td>
                      </tr>
                    ))}
                    {allRecords.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No records yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Attendance;
