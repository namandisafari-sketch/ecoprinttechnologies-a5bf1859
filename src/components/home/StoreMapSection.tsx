import { MapPin } from "lucide-react";
import { useStoreLocation } from "@/hooks/useStoreLocation";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const StoreMapSection = () => {
  const { data: location, isLoading } = useStoreLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!location || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([location.lat, location.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([location.lat, location.lng])
      .addTo(map)
      .bindPopup(location.label)
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [location]);

  // Update map when location changes
  useEffect(() => {
    if (!location || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([location.lat, location.lng], 16);
  }, [location]);

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Find Our Store</h2>
          </div>
          <p className="text-muted-foreground">
            {location?.label || "Visit us today!"}
          </p>
        </div>
        <div
          ref={mapRef}
          className="h-[350px] md:h-[450px] rounded-xl overflow-hidden border border-border shadow-lg"
          style={{ zIndex: 0 }}
        />
      </div>
    </section>
  );
};

export default StoreMapSection;
