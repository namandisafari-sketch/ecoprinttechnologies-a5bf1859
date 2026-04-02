import ecoprintLogo from "@/assets/ecoprint-logo.png";

interface A4ReceiptProps {
  order: any;
}

const A4Receipt = ({ order }: A4ReceiptProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-UG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const numberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (num === 0) return "Zero";
    if (num < 0) return "Negative " + numberToWords(-num);

    let words = "";
    if (Math.floor(num / 1000000) > 0) {
      words += numberToWords(Math.floor(num / 1000000)) + " Million ";
      num %= 1000000;
    }
    if (Math.floor(num / 1000) > 0) {
      words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
      words += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num > 0) {
      if (words !== "") words += "and ";
      if (num < 20) {
        words += ones[num];
      } else {
        words += tens[Math.floor(num / 10)];
        if (num % 10 > 0) words += " " + ones[num % 10];
      }
    }
    return words.trim();
  };

  const totalRows = 12;
  const items = order.items || [];
  const emptyRows = Math.max(0, totalRows - items.length);

  return (
    <div className="receipt font-sans text-black bg-white" style={{ width: "210mm", minHeight: "297mm", padding: "10mm 12mm", fontSize: "10pt" }}>
      {/* ===== HEADER ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #006600", paddingBottom: "4mm", marginBottom: "5mm" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4mm" }}>
          <img src={ecoprintLogo} alt="Eco Print Technologies" style={{ height: "18mm", width: "auto" }} />
          <div>
            <p style={{ fontSize: "7pt", color: "#333", margin: 0, fontWeight: 500 }}>Technologies Ltd</p>
            <p style={{ fontSize: "7pt", color: "#555", margin: 0 }}>Document Solutions</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ fontSize: "14pt", fontWeight: 800, color: "#006600", margin: 0, letterSpacing: "0.5px" }}>ECO PRINT TECHNOLOGIES</h1>
          <p style={{ fontSize: "8pt", color: "#333", margin: "1px 0", fontWeight: 600 }}>Document Solutions</p>
          <p style={{ fontSize: "8pt", color: "#cc0000", margin: "1px 0", fontWeight: 600 }}>
            📞 0702 365 176 / 0783 935 721
          </p>
          <p style={{ fontSize: "7.5pt", color: "#333", margin: "1px 0" }}>
            📍 Kampala Rd, Rm F2-4 Suncity Arcade
          </p>
          <p style={{ fontSize: "7.5pt", color: "#333", margin: "1px 0" }}>
            Email: ecoprinttechnologies2020@gmail.com
          </p>
          <p style={{ fontSize: "7pt", color: "#006600", margin: "2px 0 0", fontWeight: 600, fontStyle: "italic" }}>
            Computer Sales, Repairs, Accessories, Networking &amp; IT Support
          </p>
        </div>
      </div>

      {/* ===== CUSTOMER & INVOICE INFO ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5mm" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2mm", borderBottom: "1px dotted #999", paddingBottom: "2mm", marginBottom: "2mm" }}>
            <span style={{ fontSize: "9pt", fontWeight: 700 }}>M/S</span>
            <span style={{ fontSize: "10pt", fontWeight: 600 }}>{order.customer_name || "Walk-in Customer"}</span>
          </div>
          {order.customer_phone && order.customer_phone !== "N/A" && (
            <p style={{ fontSize: "8pt", color: "#444", margin: "1mm 0", paddingLeft: "8mm" }}>Tel: {order.customer_phone}</p>
          )}
          {order.customer_email && order.customer_email !== "pos@ecoprint.ug" && (
            <p style={{ fontSize: "8pt", color: "#444", margin: "1mm 0", paddingLeft: "8mm" }}>Email: {order.customer_email}</p>
          )}
          {order.shipping_address && order.shipping_address !== "In-Store Purchase" && (
            <p style={{ fontSize: "8pt", color: "#444", margin: "1mm 0", paddingLeft: "8mm" }}>Address: {order.shipping_address}</p>
          )}
        </div>
        <div style={{ border: "1.5px solid #333", padding: "3mm 5mm", minWidth: "55mm" }}>
          <p style={{ fontSize: "10pt", fontWeight: 800, textAlign: "center", margin: "0 0 2mm", letterSpacing: "0.5px" }}>PROFORMA-INVOICE</p>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #999", padding: "1.5mm 0" }}>
            <span style={{ fontSize: "8pt", fontWeight: 600 }}>Date:</span>
            <span style={{ fontSize: "8pt" }}>{formatDate(order.created_at)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #999", padding: "1.5mm 0" }}>
            <span style={{ fontSize: "8pt", fontWeight: 600 }}>No.</span>
            <span style={{ fontSize: "9pt", fontWeight: 700, color: "#006600" }}>{order.order_number}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #999", padding: "1.5mm 0" }}>
            <span style={{ fontSize: "8pt", fontWeight: 600 }}>Payment:</span>
            <span style={{ fontSize: "8pt", fontWeight: 600, color: "#006600" }}>
              {order.payment_method?.replace(/_/g, " ").toUpperCase() || "CASH"}
            </span>
          </div>
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3mm" }}>
        <thead>
          <tr>
            <th style={thStyle({ width: "12mm" })}>QTY</th>
            <th style={thStyle({ textAlign: "left" })}>DESCRIPTION</th>
            <th style={thStyle({ width: "30mm" })}>RATE</th>
            <th style={thStyle({ width: "35mm" })}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, index: number) => {
            const product = item.product;
            const desc = [
              product.name,
              product.model ? `Model: ${product.model}` : "",
              product.color ? `Color: ${product.color}` : "",
              product.sku ? `SKU: ${product.sku}` : "",
            ].filter(Boolean).join(", ");

            return (
              <tr key={index}>
                <td style={tdStyle({ textAlign: "center" })}>{String(item.quantity).padStart(2, "0")}</td>
                <td style={tdStyle({ textAlign: "left", fontWeight: 500 })}>{desc}</td>
                <td style={tdStyle({})}>{formatPrice(product.price)}/=</td>
                <td style={tdStyle({})}>{formatPrice(product.price * item.quantity)}/=</td>
              </tr>
            );
          })}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td style={tdStyle({ height: "7mm" })}>&nbsp;</td>
              <td style={tdStyle({})}>&nbsp;</td>
              <td style={tdStyle({})}>&nbsp;</td>
              <td style={tdStyle({})}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== TOTAL ===== */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "3mm" }}>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #333", padding: "2mm 5mm" }}>
          <span style={{ fontSize: "11pt", fontWeight: 800, marginRight: "5mm" }}>Total</span>
          <span style={{ fontSize: "12pt", fontWeight: 800, color: "#006600", fontFamily: "monospace" }}>
            {formatPrice(order.total)}/=
          </span>
        </div>
      </div>

      {/* ===== ACCOUNTS NOTE ===== */}
      <p style={{ textAlign: "center", fontSize: "8pt", fontWeight: 700, margin: "2mm 0 4mm", color: "#333" }}>
        All Accounts Are Due On Demand
      </p>

      {/* ===== AMOUNT IN WORDS ===== */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "2mm", marginBottom: "5mm", borderBottom: "1px dotted #999", paddingBottom: "2mm" }}>
        <span style={{ fontSize: "8pt", fontWeight: 600, whiteSpace: "nowrap" }}>Amount in words:</span>
        <span style={{ fontSize: "8pt", fontStyle: "italic" }}>
          {numberToWords(Math.round(order.total))} Uganda Shillings Only
        </span>
      </div>

      {/* ===== SIGNATURE ===== */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8mm" }}>
        <div style={{ textAlign: "center", minWidth: "60mm" }}>
          <div style={{ borderBottom: "1px dotted #999", marginBottom: "2mm", height: "12mm" }}></div>
          <p style={{ fontSize: "8pt", margin: 0 }}>Signed:..................................</p>
          <p style={{ fontSize: "8pt", fontWeight: 600, margin: "1mm 0 0" }}>For: Eco Print Technologies</p>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{ marginTop: "auto", paddingTop: "5mm", borderTop: "1px solid #ddd" }}>
        <p style={{ fontSize: "6.5pt", color: "#999", textAlign: "center", margin: 0 }}>
          Powered by Kabejja Systems — www.kabejjasystems.store
        </p>
      </div>
    </div>
  );
};

/* ===== Helper style functions ===== */
const thStyle = (overrides: React.CSSProperties = {}): React.CSSProperties => ({
  border: "1.5px solid #333",
  padding: "2.5mm 3mm",
  fontSize: "9pt",
  fontWeight: 700,
  textAlign: "center",
  background: "#f5f5f5",
  ...overrides,
});

const tdStyle = (overrides: React.CSSProperties = {}): React.CSSProperties => ({
  border: "1px solid #999",
  padding: "2mm 3mm",
  fontSize: "9pt",
  textAlign: "right",
  verticalAlign: "top",
  ...overrides,
});

export default A4Receipt;
