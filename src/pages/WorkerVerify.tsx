import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
const supabase = supabaseTyped as any;
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ShieldCheck, Phone, Mail, MapPin, Calendar, Building2, Briefcase, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import ecoprintLogo from "@/assets/ecoprint-logo.png";

const statusBadge = (status: string) => {
  const s = (status || "active").toLowerCase();
  const map: Record<string, { className: string; label: string; valid: boolean }> = {
    active: { className: "bg-emerald-600 hover:bg-emerald-700", label: "ACTIVE", valid: true },
    on_vacation: { className: "bg-sky-600 hover:bg-sky-700", label: "ON VACATION", valid: true },
    on_holiday: { className: "bg-purple-600 hover:bg-purple-700", label: "ON HOLIDAY", valid: true },
    left: { className: "bg-red-600 hover:bg-red-700", label: "LEFT", valid: false },
    denied: { className: "bg-red-800 hover:bg-red-900", label: "DENIED", valid: false },
    "n/a": { className: "bg-gray-500 hover:bg-gray-600", label: "N/A", valid: false },
  };
  return map[s] || { className: "bg-gray-500", label: s.toUpperCase(), valid: false };
};

const WorkerVerify = () => {
  const { id } = useParams<{ id: string }>();

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker-verify", id],
    queryFn: async () => {
      const { data } = await supabase.from("workers").select("*").eq("id", id).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Verifying...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">Invalid ID</h1>
            <p className="text-sm text-muted-foreground mt-2">This worker code could not be verified.</p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusBadge(worker.status);
  const expired = worker.validity_date && new Date(worker.validity_date) < new Date();
  const trulyValid = status.valid && !expired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/40 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Brand header */}
        <div className="text-center mb-6">
          <img src={ecoprintLogo} alt="Eco Print Technologies" className="h-12 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground tracking-wider">STAFF VERIFICATION PORTAL</p>
        </div>

        <Card className="overflow-hidden shadow-2xl">
          {/* Status banner */}
          <div className={`${trulyValid ? "bg-emerald-600" : "bg-destructive"} text-white p-4 flex items-center gap-3`}>
            {trulyValid ? <ShieldCheck className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            <div>
              <p className="font-bold text-lg">{trulyValid ? "Verified Staff" : "Not Currently Verified"}</p>
              <p className="text-xs opacity-90">
                {trulyValid ? "This person is an authorized representative" : expired ? "ID has expired" : "ID is no longer active"}
              </p>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Photo + name */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-28 h-28 rounded-lg overflow-hidden border-4 border-primary bg-muted flex items-center justify-center flex-shrink-0">
                {worker.photo_url ? (
                  <img src={worker.photo_url} alt={worker.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground">{worker.full_name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground leading-tight">{worker.full_name}</h1>
                <p className="text-primary font-semibold mt-1">{worker.position || worker.department}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">ID: {worker.worker_code}</p>
                <Badge className={`${status.className} text-white mt-2`}>{status.label}</Badge>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 border-t pt-4">
              <Row icon={<Building2 className="h-4 w-4" />} label="Department" value={worker.department} />
              {worker.position && <Row icon={<Briefcase className="h-4 w-4" />} label="Position" value={worker.position} />}
              <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={worker.phone} />
              {worker.email && <Row icon={<Mail className="h-4 w-4" />} label="Email" value={worker.email} />}
              {worker.residence && <Row icon={<MapPin className="h-4 w-4" />} label="Residence" value={worker.residence} />}
              {worker.date_joined && <Row icon={<Calendar className="h-4 w-4" />} label="Date Joined" value={format(new Date(worker.date_joined), "dd MMM yyyy")} />}
              {worker.validity_date && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="Valid Until"
                  value={format(new Date(worker.validity_date), "dd MMM yyyy")}
                  highlight={expired ? "destructive" : "success"}
                />
              )}
            </div>

            {/* Notes */}
            {worker.notes && (
              <div className="mt-6 p-4 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{worker.notes}</p>
              </div>
            )}
          </CardContent>

          {/* Footer */}
          <div className="bg-muted/50 px-6 py-3 text-center border-t">
            <p className="text-xs text-muted-foreground">
              {trulyValid ? <CheckCircle2 className="inline h-3 w-3 mr-1 text-emerald-600" /> : null}
              Eco Print Technologies Ltd · ecoprint.ug
            </p>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: "success" | "destructive" }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground w-28">{label}:</span>
    <span
      className={`font-medium flex-1 ${
        highlight === "destructive" ? "text-destructive" : highlight === "success" ? "text-emerald-600" : "text-foreground"
      }`}
    >
      {value}
    </span>
  </div>
);

export default WorkerVerify;
