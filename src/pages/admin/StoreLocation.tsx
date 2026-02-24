import { useState, useEffect, useRef } from "react";
import { useStoreLocation, useUpdateStoreLocation, StoreLocation } from "@/hooks/useStoreLocation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const AdminStoreLocation = () => {
  const { data: location, isLoading } = useStoreLocation();
  const updateLocation = useUpdateStoreLocation();
  const { toast } = useToast();

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [label, setLabel] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (location) {
      setLat(String(location.lat));
      setLng(String(location.lng));
      setLabel(location.label);
    }
  }, [location]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialLat = location?.lat || 0.3136;
    const initialLng = location?.lng || 32.5811;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLat(pos.lat.toFixed(6));
      setLng(pos.lng.toFixed(6));
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat.toFixed(6));
      setLng(e.latlng.lng.toFixed(6));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [location]);

  const handleSave = async () => {
    const newLocation: StoreLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      label,
    };

    try {
      await updateLocation.mutateAsync(newLocation);
      if (markerRef.current) {
        markerRef.current.setLatLng([newLocation.lat, newLocation.lng]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([newLocation.lat, newLocation.lng], 16);
      }
      toast({ title: "Location updated", description: "Store location has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to update location.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Store Location</h1>
        <p className="text-muted-foreground">Set your store's location on the map</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map Location
          </CardTitle>
          <CardDescription>Click the map or drag the marker to set your store's position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={mapRef}
            className="h-[350px] md:h-[450px] rounded-lg overflow-hidden border border-border"
            style={{ zIndex: 0 }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="0.3136"
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="32.5811"
              />
            </div>
            <div>
              <Label>Store Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Eco Print Technologies - Suncity Mall"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateLocation.isPending} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {updateLocation.isPending ? "Saving..." : "Save Location"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStoreLocation;
