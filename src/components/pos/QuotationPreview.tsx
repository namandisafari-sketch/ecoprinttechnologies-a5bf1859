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

// === Decorative green corner bars (matches the PDF) ===
const CornerBars = ({ position }: { position: "top" | "bottom" }) => {
  const isTop = position === "top";
  // Stack of vertical green bars of varying heights and shades
  const bars = isTop
    ? [
        { left: "0mm", width: "8mm", height: "55mm", color: "#00e64d" },
        { left: "8mm", width: "10mm", height: "42mm", color: "#00b33c" },
        { left: "18mm", width: "8mm", height: "30mm", color: "#008f2e" },
        { left: "26mm", width: "6mm", height: "18mm", color: "#33ff66" },
      ]
    : [
        { right: "0mm", width: "8mm", height: "55mm", color: "#00e64d" },
        { right: "8mm", width: "10mm", height: "42mm", color: "#00b33c" },
        { right: "18mm", width: "8mm", height: "30mm", color: "#475569" },
        { right: "26mm", width: "6mm", height: "18mm", color: "#33ff66" },
      ];

  return (
    <div
      style={{
        position: "absolute",
        [isTop ? "top" : "bottom"]: 0,
        [isTop ? "left" : "right"]: 0,
        height: "55mm",
        width: "32mm",
        pointerEvents: "none",
      }}
    >
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            [isTop ? "top" : "bottom"]: 0,
            ...(isTop ? { left: bar.left } : { right: bar.right }),
            width: bar.width,
            height: bar.height,
            background: bar.color,
          }}
        />
      ))}
    </div>
  );
};

const QuotationPreview = ({ data }: QuotationPreviewProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/ ${d.getFullYear()}`;
  };

  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vatAmount = Math.round(subtotal * 0.18);
  const totalInclusive = subtotal + vatAmount;

  const defaultNotes = [
    `100% cash or bank payment should be made on Acc. No. 01353658206415 Acc. Name. Ecoprint Technologies Ltd, DFCU Bank Uganda after delivery of items`,
    `Delivery of items shall be made after the LPO.`,
    `The quoted items are covered by One Year warranty from the date of delivery.`,
    `Ecoprint Technologies Ltd will not be liable for the damages and breakages of the items after delivery.`,
    `For any further clarifications, please do not hesitate to contact us.`,
  ];

  const notes = data.notes.length > 0 ? data.notes : defaultNotes;

  return (
    <div
      className="quotation-preview"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "0",
        fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
        color: "#1a1a1a",
        background: "#fff",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* === TOP-LEFT GREEN BARS === */}
      <CornerBars position="top" />

      {/* === HEADER === */}
      <div style={{ padding: "8mm 12mm 0 40mm", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start" }}>
          <img
            src={ecoprintLogo}
            alt="Ecoprint Technologies Ltd"
            style={{ height: "28mm", width: "auto", display: "block" }}
          />
        </div>
        <div style={{ textAlign: "right", marginTop: "2mm" }}>
          <p style={{ fontSize: "11pt", fontWeight: 700, margin: 0, color: "#000" }}>
            Computer sales, repairs, accessories, networking &amp; IT Support
          </p>
          <p style={{ fontSize: "11pt", margin: "1mm 0 0", color: "#000" }}>
            F2-4 Suncity Plaza, Kampala Road
          </p>
          <p style={{ fontSize: "11pt", margin: "1mm 0 0", color: "#000" }}>
            Tel: +256 702 365 176/ +256 783 393 721
          </p>
        </div>
        {/* Blue underline rule */}
        <div style={{ marginTop: "3mm", borderBottom: "1px solid #4a90e2" }} />
      </div>

      {/* === BODY === */}
      <div style={{ padding: "8mm 14mm 0 14mm", minHeight: "200mm" }}>
        {/* Date - right aligned */}
        <p style={{ textAlign: "center", fontSize: "12pt", margin: "0 0 8mm 0" }}>
          {formatDate(data.date)}
        </p>

        {/* TO: */}
        <p style={{ fontSize: "12pt", margin: "0 0 6mm 0" }}>
          TO: {data.customerName.toUpperCase() || "___________________________"}
        </p>

        {/* RE: */}
        <p style={{ fontSize: "12pt", margin: "0 0 4mm 0" }}>
          RE:&nbsp;&nbsp;{data.subject || "QUOTATION FOR SALE OF LAPTOP COMPUTER"}
        </p>

        {/* Opening paragraph */}
        <p style={{ fontSize: "12pt", lineHeight: 1.4, margin: "0 0 5mm 0" }}>
          We thank you for the opportunity given to our company to quote for your requirements.
          As a reputable reseller/distributor and service center for computers and accessories,
          we are pleased to include our best offers for you below;
        </p>

        {/* Pricing Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5mm" }}>
          <thead>
            <tr>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, width: "40mm" }}>
                Amount<br />VAT(18%)EXCLUSIVE
              </th>
              {data.includeVAT && (
                <th style={{ ...thStyle, width: "40mm" }}>
                  AMOUNT<br />VAT(18%) INCLUSIVE
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const lineTotal = item.unitPrice * item.quantity;
              const lineWithVat = Math.round(lineTotal * 1.18);
              return (
                <tr key={i}>
                  <td style={tdDesc}>
                    <div style={{ fontWeight: 700 }}>
                      {item.description}
                      {item.quantity > 1 && (
                        <span style={{ fontWeight: 400, color: "#444" }}> (×{item.quantity})</span>
                      )}
                    </div>
                  </td>
                  <td style={tdNumber}>{formatPrice(lineTotal)}</td>
                  {data.includeVAT && <td style={tdNumber}>{formatPrice(lineWithVat)}</td>}
                </tr>
              );
            })}
            {data.items.length > 0 && (
              <tr>
                <td style={{ ...tdDesc, fontWeight: 700, textAlign: "right" }}>TOTAL</td>
                <td style={{ ...tdNumber, fontWeight: 700 }}>{formatPrice(subtotal)}</td>
                {data.includeVAT && (
                  <td style={{ ...tdNumber, fontWeight: 700 }}>{formatPrice(totalInclusive)}</td>
                )}
              </tr>
            )}
          </tbody>
        </table>

        {/* Terms & Conditions */}
        <div style={{ marginTop: "8mm" }}>
          <p style={{ fontSize: "12pt", fontWeight: 700, textDecoration: "underline", margin: "0 0 3mm 0" }}>
            Terms &amp; Conditions
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {notes.map((note, i) => (
              <li
                key={i}
                style={{
                  fontSize: "11pt",
                  lineHeight: 1.5,
                  marginBottom: "3mm",
                  paddingLeft: "8mm",
                  position: "relative",
                }}
              >
                <span style={{ position: "absolute", left: "2mm", top: 0, color: "#000", fontSize: "11pt" }}>
                  ▪
                </span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Signature block */}
        <div style={{ marginTop: "10mm" }}>
          <p style={{ fontSize: "12pt", margin: "0 0 2mm 0" }}>Kind regards,</p>
          <img
            src={signatureImg}
            alt="Signature"
            style={{ height: "16mm", width: "auto", display: "block", marginBottom: "1mm" }}
          />
          <p style={{ fontSize: "12pt", fontWeight: 700, margin: 0 }}>Ssentongo Fahd</p>
        </div>
      </div>

      {/* === FOOTER === */}
      <div style={{ position: "relative", marginTop: "auto", paddingTop: "10mm" }}>
        {/* Bottom-right green bars */}
        <CornerBars position="bottom" />

        <div style={{ padding: "0 40mm 12mm 14mm", textAlign: "right" }}>
          <p style={{ fontSize: "11pt", margin: "0 0 2mm 0", color: "#000" }}>
            +256 702 365 176/ +256 783 393721 &nbsp;<span style={{ color: "#000" }}>📞</span>
          </p>
          <p style={{ fontSize: "11pt", margin: "0 0 2mm 0" }}>
            <a href="mailto:ecoprinttechnologies2020@gmail.com" style={{ color: "#1155cc", textDecoration: "underline" }}>
              ecoprinttechnologies2020@gmail.com
            </a>
            &nbsp;<span>✉️</span>
          </p>
          <p style={{ fontSize: "11pt", margin: "0 0 2mm 0" }}>
            <a href="http://www.ecoprinttechnologies.com" style={{ color: "#1155cc", textDecoration: "underline" }}>
              www.ecoprinttechnologies.com
            </a>
            &nbsp;<span>🌐</span>
          </p>
          <p style={{ fontSize: "11pt", margin: 0, color: "#000" }}>
            F2-4 Suncity Plaza Kampala Road, Kampala &nbsp;<span>🏠</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "3mm",
  fontSize: "11pt",
  fontWeight: 400,
  textAlign: "center",
  background: "#fff",
  verticalAlign: "top",
};

const tdDesc: React.CSSProperties = {
  border: "1px solid #000",
  padding: "3mm",
  fontSize: "11pt",
  textAlign: "left",
  verticalAlign: "top",
};

const tdNumber: React.CSSProperties = {
  border: "1px solid #000",
  padding: "3mm",
  fontSize: "11pt",
  textAlign: "right",
  verticalAlign: "top",
};

export default QuotationPreview;
export type { QuotationData, QuotationItem };
