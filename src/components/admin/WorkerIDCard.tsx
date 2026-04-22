import { QRCodeSVG } from "qrcode.react";
import ecoprintLogo from "@/assets/ecoprint-logo.png";
import { format } from "date-fns";

interface WorkerIDCardProps {
  worker: any;
  side?: "front" | "back";
}

const statusStyle = (status: string) => {
  const s = (status || "active").toLowerCase();
  if (s === "active") return { bg: "#16a34a", label: "ACTIVE" };
  if (s === "on_vacation" || s === "on vacation") return { bg: "#0ea5e9", label: "ON VACATION" };
  if (s === "on_holiday" || s === "on holiday") return { bg: "#8b5cf6", label: "ON HOLIDAY" };
  if (s === "left") return { bg: "#dc2626", label: "LEFT" };
  if (s === "denied") return { bg: "#991b1b", label: "DENIED" };
  if (s === "n/a" || s === "na") return { bg: "#6b7280", label: "N/A" };
  return { bg: "#6b7280", label: s.toUpperCase() };
};

const cardShell: React.CSSProperties = {
  width: "85.6mm",
  height: "53.98mm",
  borderRadius: "3mm",
  overflow: "hidden",
  position: "relative",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  border: "1px solid #e5e7eb",
};

const WorkerIDCard = ({ worker, side = "front" }: WorkerIDCardProps) => {
  const verifyUrl = `${window.location.origin}/worker/${worker.id}`;
  const status = statusStyle(worker.status);

  if (side === "back") {
    return (
      <div className="bg-white shadow-xl" style={cardShell}>
        {/* Header strip (mirrored) */}
        <div
          style={{
            background: "linear-gradient(90deg, #cc0000 0%, #009933 40%, #006600 100%)",
            height: "8mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <p style={{ fontSize: "6.5pt", fontWeight: 700, letterSpacing: "0.5px", margin: 0 }}>
            ECO PRINT TECHNOLOGIES — TERMS OF USE
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "2mm 3mm", height: "calc(100% - 8mm - 6mm)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <ol style={{ fontSize: "5pt", color: "#333", lineHeight: 1.4, paddingLeft: "3mm", margin: 0 }}>
            <li>This card remains the property of Eco Print Technologies and must be returned upon request.</li>
            <li>The holder must present this card on entry and at all times while on duty.</li>
            <li>Loss or damage must be reported immediately to management.</li>
            <li>Misuse, alteration or transfer of this card is strictly prohibited.</li>
            <li>If found, please return to the address below — reward applies.</li>
          </ol>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "2mm" }}>
            <div style={{ fontSize: "5pt", color: "#444", lineHeight: 1.3 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#006600" }}>HEAD OFFICE</p>
              <p style={{ margin: 0 }}>Plot 12, Industrial Area, Kampala</p>
              <p style={{ margin: 0 }}>Tel: +256 700 000 000</p>
              <p style={{ margin: 0 }}>info@ecoprint.ug · ecoprint.ug</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "#fff", padding: "0.5mm", border: "1px solid #e5e7eb" }}>
                <QRCodeSVG value={verifyUrl} size={48} level="M" />
              </div>
              <p style={{ fontSize: "4pt", color: "#666", margin: "0.5mm 0 0" }}>VERIFY HOLDER</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#f3f4f6",
            padding: "1mm 3mm",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "5pt",
            color: "#666",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <span>Holder signature: ___________________</span>
          <span>{worker.worker_code}</span>
        </div>
      </div>
    );
  }

  // FRONT
  return (
    <div className="bg-white shadow-xl" style={cardShell}>
      {/* Header strip */}
      <div
        style={{
          background: "linear-gradient(90deg, #006600 0%, #009933 60%, #cc0000 100%)",
          height: "10mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 3mm",
          color: "#fff",
        }}
      >
        <img src={ecoprintLogo} alt="Eco Print" style={{ height: "7mm", width: "auto", filter: "brightness(0) invert(1)" }} />
        <div style={{ textAlign: "right", lineHeight: 1 }}>
          <p style={{ fontSize: "7pt", fontWeight: 700, margin: 0, letterSpacing: "0.5px" }}>ECO PRINT TECHNOLOGIES</p>
          <p style={{ fontSize: "5pt", margin: "0.5mm 0 0", opacity: 0.9 }}>STAFF IDENTIFICATION</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", padding: "3mm", gap: "3mm", height: "calc(100% - 10mm - 6mm)" }}>
        {/* Photo */}
        <div
          style={{
            width: "22mm",
            height: "26mm",
            border: "1.5px solid #006600",
            borderRadius: "1.5mm",
            overflow: "hidden",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {worker.photo_url ? (
            <img src={worker.photo_url} alt={worker.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "20pt", color: "#9ca3af", fontWeight: 700 }}>
              {worker.full_name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "9pt", fontWeight: 800, color: "#111", margin: 0, lineHeight: 1.1 }}>
              {worker.full_name}
            </p>
            <p style={{ fontSize: "6.5pt", color: "#006600", fontWeight: 600, margin: "0.5mm 0 0" }}>
              {worker.position || worker.department}
            </p>
            <div style={{ marginTop: "1.5mm", fontSize: "5.5pt", color: "#444", lineHeight: 1.4 }}>
              <p style={{ margin: 0 }}><strong>ID:</strong> {worker.worker_code}</p>
              <p style={{ margin: 0 }}><strong>Dept:</strong> {worker.department}</p>
              <p style={{ margin: 0 }}><strong>Tel:</strong> {worker.phone}</p>
            </div>
          </div>
          <div
            style={{
              background: status.bg,
              color: "#fff",
              fontSize: "6.5pt",
              fontWeight: 800,
              textAlign: "center",
              padding: "1mm 2mm",
              borderRadius: "1mm",
              letterSpacing: "0.5px",
            }}
          >
            {status.label}
          </div>
        </div>

        {/* QR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ background: "#fff", padding: "1mm", border: "1px solid #e5e7eb" }}>
            <QRCodeSVG value={verifyUrl} size={68} level="M" />
          </div>
          <p style={{ fontSize: "4.5pt", color: "#666", margin: "1mm 0 0", textAlign: "center" }}>
            SCAN TO VERIFY
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#f3f4f6",
          padding: "1mm 3mm",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "5pt",
          color: "#666",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <span>Valid until: <strong>{worker.validity_date ? format(new Date(worker.validity_date), "dd MMM yyyy") : "—"}</strong></span>
        <span>ecoprint.ug</span>
      </div>
    </div>
  );
};

export default WorkerIDCard;
