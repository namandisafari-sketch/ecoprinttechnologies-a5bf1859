import ecoprintLogo from "@/assets/ecoprint-logo-text.png";
import signatureImg from "@/assets/signature.jpg";

interface QuotationItem {
  description: string;
  unitPrice: number;
  quantity: number;
}

interface QuotationData {
  customerName: string;
  date: string;
  subject: string;
  items: QuotationItem[];
  includeVAT: boolean;
  paymentTerms: string;
  testingDuration: string;
  notes: string[];
}

interface QuotationPreviewProps {
  data: QuotationData;
}

const QuotationPreview = ({ data }: QuotationPreviewProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-UG", { month: "long", day: "numeric", year: "numeric" });

  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vatAmount = data.includeVAT ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + vatAmount;

  const defaultNotes = [
    `100% payment should be made within ${data.paymentTerms || "3 (three)"} days after delivery on Acc. No. 3658206415 Acc. Name. Ecoprint Technologies Ltd DFCU Bank Uganda.`,
    `A duration of ${data.testingDuration || "24 hours"} is provided for testing the items delivered.`,
    "Ecoprint Technologies Ltd is not liable for the damages and breakages of the items delivered.",
    "If you require additional items, this can be availed at the same unit price per day.",
    "For any further clarifications, please do not hesitate to contact us.",
  ];

  const notes = data.notes.length > 0 ? data.notes : defaultNotes;

  return (
    <div className="quotation-preview" style={{ width: "210mm", minHeight: "297mm", padding: "10mm 15mm", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#222", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* === HEADER === */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2mm" }}>
        {/* Left: green/red accent block */}
        <div style={{ display: "flex", gap: 0, marginTop: "2mm" }}>
          <div style={{ width: "12mm", height: "28mm", background: "#006600", borderRadius: "2px 0 0 2px" }} />
          <div style={{ width: "12mm", height: "28mm", background: "#cc0000", borderRadius: "0 2px 2px 0" }} />
        </div>
        {/* Right: logo + info */}
        <div style={{ textAlign: "right" }}>
          <img src={ecoprintLogo} alt="Eco Print Technologies" style={{ height: "16mm", width: "auto", marginBottom: "2mm" }} />
          <p style={{ fontSize: "9pt", fontWeight: 700, color: "#333", margin: "1px 0" }}>
            Computer sales, repairs, accessories, networking &amp; IT Support
          </p>
          <p style={{ fontSize: "8pt", color: "#444", margin: "1px 0" }}>
            F2-4 Suncity Plaza, Kampala Road
          </p>
          <p style={{ fontSize: "8pt", color: "#444", margin: "1px 0" }}>
            Tel: +256 702 365176 / +256 783 935721
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderBottom: "2px solid #006600", marginBottom: "5mm" }} />

      {/* Date */}
      <p style={{ textAlign: "right", fontSize: "9pt", marginBottom: "4mm" }}>
        {formatDate(data.date)}
      </p>

      {/* To */}
      <p style={{ fontSize: "9pt", marginBottom: "5mm" }}>
        to: <strong>{data.customerName || "___________________________"}</strong>
      </p>

      {/* Subject */}
      <h2 style={{ fontSize: "11pt", fontWeight: 800, marginBottom: "5mm", textDecoration: "underline" }}>
        RE: {data.subject || "QUOTATION FOR SALE OF LAPTOPS."}
      </h2>

      {/* Intro */}
      <p style={{ fontSize: "9pt", lineHeight: 1.6, marginBottom: "5mm" }}>
        We thank you for the opportunity given to our company to quote for your requirements.
        As a reputable reseller/distributor and service center for computers and accessories,
        we are pleased to include our best offers for you as below;
      </p>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5mm" }}>
        <thead>
          <tr>
            <th style={thS({ textAlign: "left" })}>Description</th>
            <th style={thS({ width: "35mm" })}>Unit Price</th>
            <th style={thS({ width: "35mm" })}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={tdS({ textAlign: "left" })}>
                {item.description}
                {item.quantity > 1 && <span style={{ color: "#666", fontSize: "8pt" }}> (×{item.quantity})</span>}
              </td>
              <td style={tdS({})}>{formatPrice(item.unitPrice)}</td>
              <td style={tdS({})}>{formatPrice(item.unitPrice * item.quantity)}</td>
            </tr>
          ))}
          {data.includeVAT && (
            <tr>
              <td style={tdS({ textAlign: "right", fontWeight: 600, border: "none" })} colSpan={2}>VAT 18%</td>
              <td style={tdS({})}>{formatPrice(vatAmount)}</td>
            </tr>
          )}
          <tr>
            <td style={tdS({ textAlign: "right", fontWeight: 700, border: "none" })} colSpan={2}>Total amount</td>
            <td style={{ ...tdS({}), fontWeight: 700, fontSize: "10pt" }}>{formatPrice(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* Terms */}
      <ul style={{ listStyleType: "'-  '", paddingLeft: "5mm", marginBottom: "6mm" }}>
        {notes.map((note, i) => (
          <li key={i} style={{ fontSize: "8.5pt", lineHeight: 1.6, marginBottom: "2mm" }}>{note}</li>
        ))}
      </ul>

      {/* Signature */}
      <div style={{ marginBottom: "8mm" }}>
        <p style={{ fontSize: "9pt", marginBottom: "2mm" }}>Warm regards,</p>
        <img src={signatureImg} alt="Signature" style={{ height: "14mm", width: "auto", marginBottom: "1mm" }} />
        <p style={{ fontSize: "9pt", fontWeight: 700, margin: "1mm 0" }}>Ssentongo Fahd</p>
        <p style={{ fontSize: "8pt", color: "#444", margin: "1mm 0" }}>Managing Director</p>
        <p style={{ fontSize: "8pt", fontWeight: 600, margin: "1mm 0" }}>Ecoprint Technologies Ltd</p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #006600", paddingTop: "3mm" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "8mm", flexWrap: "wrap" }}>
          <span style={{ fontSize: "8pt", color: "#333" }}>📞 +256 702 365176 / +256 783 935721</span>
          <span style={{ fontSize: "8pt", color: "#333" }}>✉ ecoprinttechnologies2020@gmail.com</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "8mm", marginTop: "1mm" }}>
          <span style={{ fontSize: "8pt", color: "#333" }}>🌐 www.ecoprinttechnologies.com</span>
          <span style={{ fontSize: "8pt", color: "#333" }}>📍 F2-4 Suncity Plaza Kampala Road, Kampala</span>
        </div>
      </div>
    </div>
  );
};

const thS = (ov: React.CSSProperties = {}): React.CSSProperties => ({
  border: "1.5px solid #333",
  padding: "2.5mm 3mm",
  fontSize: "9pt",
  fontWeight: 700,
  textAlign: "center",
  background: "#f5f5f5",
  ...ov,
});

const tdS = (ov: React.CSSProperties = {}): React.CSSProperties => ({
  border: "1px solid #999",
  padding: "2mm 3mm",
  fontSize: "9pt",
  textAlign: "right",
  verticalAlign: "top",
  ...ov,
});

export default QuotationPreview;
export type { QuotationData, QuotationItem };
