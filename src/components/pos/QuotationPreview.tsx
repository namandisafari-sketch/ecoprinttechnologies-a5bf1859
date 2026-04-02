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
    <div className="quotation-preview" style={{ width: "210mm", height: "297mm", maxHeight: "297mm", overflow: "hidden", padding: "8mm 12mm", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#222", background: "#fff", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      {/* === HEADER === */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1mm" }}>
        {/* Staircase color blocks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: "0" }}>
          {/* Row 1: 4 blocks */}
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ width: "7mm", height: "8mm", background: "#00ff00" }} />
            <div style={{ width: "7mm", height: "8mm", background: "#00cc00" }} />
            <div style={{ width: "7mm", height: "8mm", background: "#006600" }} />
            <div style={{ width: "7mm", height: "8mm", background: "#00ffcc" }} />
          </div>
          {/* Row 2: 2 blocks */}
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ width: "7mm", height: "10mm", background: "#00ff00" }} />
            <div style={{ width: "7mm", height: "10mm", background: "#00cc00" }} />
          </div>
          {/* Row 3: 2 narrower blocks */}
          <div style={{ display: "flex", gap: 0 }}>
            <div style={{ width: "5mm", height: "8mm", background: "#00ff00" }} />
            <div style={{ width: "5mm", height: "8mm", background: "#00cc00" }} />
          </div>
        </div>
        {/* Right: Logo + contact centered */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <img src={ecoprintLogo} alt="Eco Print Technologies" style={{ height: "14mm", width: "auto", marginBottom: "1mm" }} />
          <p style={{ fontSize: "8.5pt", fontWeight: 700, color: "#333", margin: "0" }}>
            Computer sales, repairs, accessories, networking &amp; IT Support
          </p>
          <p style={{ fontSize: "7.5pt", color: "#444", margin: "0" }}>
            F24 Suncity Plaza, Kampala Road
          </p>
          <p style={{ fontSize: "7.5pt", color: "#444", margin: "0" }}>
            Tel: +256 702 365176 / +256783 935721
          </p>
        </div>
      </div>

      <div style={{ borderBottom: "2px solid #006600", marginBottom: "3mm" }} />

      <p style={{ textAlign: "right", fontSize: "8.5pt", marginBottom: "2mm" }}>
        {formatDate(data.date)}
      </p>

      <p style={{ fontSize: "8.5pt", marginBottom: "3mm" }}>
        to: <strong>{data.customerName || "___________________________"}</strong>
      </p>

      <h2 style={{ fontSize: "10pt", fontWeight: 800, marginBottom: "3mm", textDecoration: "underline" }}>
        RE: {data.subject || "QUOTATION FOR SALE OF LAPTOPS."}
      </h2>

      <p style={{ fontSize: "8pt", lineHeight: 1.5, marginBottom: "3mm" }}>
        We thank you for the opportunity given to our company to quote for your requirements.
        As a reputable reseller/distributor and service center for computers and accessories,
        we are pleased to include our best offers for you as below;
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3mm" }}>
        <thead>
          <tr>
            <th style={thS({ textAlign: "left" })}>Description</th>
            <th style={thS({ width: "30mm" })}>Unit Price</th>
            <th style={thS({ width: "30mm" })}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={tdS({ textAlign: "left" })}>
                {item.description}
                {item.quantity > 1 && <span style={{ color: "#666", fontSize: "7.5pt" }}> (×{item.quantity})</span>}
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
            <td style={{ ...tdS({}), fontWeight: 700, fontSize: "9pt" }}>{formatPrice(total)}</td>
          </tr>
        </tbody>
      </table>

      <ul style={{ listStyleType: "'-  '", paddingLeft: "4mm", marginBottom: "3mm" }}>
        {notes.map((note, i) => (
          <li key={i} style={{ fontSize: "7.5pt", lineHeight: 1.4, marginBottom: "1mm" }}>{note}</li>
        ))}
      </ul>

      <div style={{ marginBottom: "2mm" }}>
        <p style={{ fontSize: "8pt", marginBottom: "1mm" }}>Warm regards,</p>
        <img src={signatureImg} alt="Signature" style={{ height: "12mm", width: "auto", marginBottom: "0" }} />
        <p style={{ fontSize: "8.5pt", fontWeight: 700, margin: "0" }}>Ssentongo Fahd</p>
        <p style={{ fontSize: "7.5pt", color: "#444", margin: "0" }}>Managing Director</p>
        <p style={{ fontSize: "7.5pt", fontWeight: 600, margin: "0" }}>Ecoprint Technologies Ltd</p>
      </div>

      <div style={{ marginTop: "auto", borderTop: "1px solid #006600", paddingTop: "2mm" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "6mm", flexWrap: "wrap" }}>
          <span style={{ fontSize: "7.5pt", color: "#333" }}>📞 +256 702 365176 / +256 783 935721</span>
          <span style={{ fontSize: "7.5pt", color: "#333" }}>✉ ecoprinttechnologies2020@gmail.com</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "6mm", marginTop: "0.5mm" }}>
          <span style={{ fontSize: "7.5pt", color: "#333" }}>🌐 www.ecoprinttechnologies.com</span>
          <span style={{ fontSize: "7.5pt", color: "#333" }}>📍 F2-4 Suncity Plaza Kampala Road, Kampala</span>
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
