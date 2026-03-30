import ecoprintLogo from "@/assets/ecoprint-logo.png";

interface A4ReceiptProps {
  order: any;
}

const A4Receipt = ({ order }: A4ReceiptProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="receipt font-sans text-black bg-white" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", fontSize: "10pt" }}>
      {/* Header with Logo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "6mm", marginBottom: "6mm" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5mm" }}>
          <img src={ecoprintLogo} alt="Eco Print Technologies" style={{ height: "16mm", width: "auto" }} />
          <div>
            <p style={{ fontSize: "8pt", color: "#555", margin: "2px 0 0" }}>Laptops, Printers & Tech Services</p>
            <p style={{ fontSize: "7.5pt", color: "#777", marginTop: "2px", lineHeight: 1.5 }}>
              Tel: +256 705 154 828 &nbsp;|&nbsp; Email: info@ecoprint.ug<br />
              Suncity Mall, Kampala, Uganda
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "16pt", fontWeight: 700, color: "#333", margin: 0 }}>SALES INVOICE</h2>
          <p style={{ fontSize: "11pt", fontFamily: "monospace", marginTop: "3px", fontWeight: 600 }}>{order.order_number}</p>
          <p style={{ fontSize: "8pt", color: "#666", marginTop: "2px" }}>{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Customer & Payment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8mm", marginBottom: "6mm" }}>
        <div style={{ background: "#f8f8f8", padding: "4mm 5mm", borderRadius: "3px", border: "1px solid #e5e5e5" }}>
          <h3 style={{ fontSize: "8pt", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3px" }}>Billed To</h3>
          <p style={{ fontWeight: 600, fontSize: "10pt", margin: "2px 0" }}>{order.customer_name || "Walk-in Customer"}</p>
          {order.customer_phone && order.customer_phone !== "N/A" && (
            <p style={{ fontSize: "9pt", color: "#555", margin: "1px 0" }}>Phone: {order.customer_phone}</p>
          )}
          {order.customer_email && order.customer_email !== "pos@ecoprint.ug" && (
            <p style={{ fontSize: "9pt", color: "#555", margin: "1px 0" }}>Email: {order.customer_email}</p>
          )}
          {order.shipping_address && order.shipping_address !== "In-Store Purchase" && (
            <p style={{ fontSize: "9pt", color: "#555", margin: "1px 0" }}>Address: {order.shipping_address}</p>
          )}
        </div>
        <div style={{ background: "#f8f8f8", padding: "4mm 5mm", borderRadius: "3px", border: "1px solid #e5e5e5" }}>
          <h3 style={{ fontSize: "8pt", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3px" }}>Payment Information</h3>
          <p style={{ fontSize: "9pt", margin: "2px 0" }}>
            <span style={{ color: "#555" }}>Method:</span>{" "}
            <strong>{order.payment_method?.replace(/_/g, " ").toUpperCase()}</strong>
          </p>
          <p style={{ fontSize: "9pt", margin: "2px 0" }}>
            <span style={{ color: "#555" }}>Status:</span>{" "}
            <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ PAID</span>
          </p>
          <p style={{ fontSize: "9pt", margin: "2px 0" }}>
            <span style={{ color: "#555" }}>Date:</span>{" "}
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      {/* Items with Product Photos */}
      <div style={{ marginBottom: "5mm" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1a1a1a", color: "#fff" }}>
              <th style={{ textAlign: "left", padding: "3mm 4mm", fontSize: "8pt", fontWeight: 600 }}>#</th>
              <th style={{ textAlign: "left", padding: "3mm 4mm", fontSize: "8pt", fontWeight: 600 }}>Product</th>
              <th style={{ textAlign: "center", padding: "3mm 4mm", fontSize: "8pt", fontWeight: 600 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "3mm 4mm", fontSize: "8pt", fontWeight: 600 }}>Unit Price</th>
              <th style={{ textAlign: "right", padding: "3mm 4mm", fontSize: "8pt", fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, index: number) => {
              const product = item.product;
              const imageUrl = product.image_url || (product.images && product.images[0]);
              return (
                <tr key={index} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "3mm 4mm", fontSize: "9pt", color: "#888", verticalAlign: "top" }}>{index + 1}</td>
                  <td style={{ padding: "3mm 4mm" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "3mm" }}>
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          style={{ width: "18mm", height: "18mm", objectFit: "cover", borderRadius: "2px", border: "1px solid #e5e5e5", flexShrink: 0 }}
                        />
                      )}
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "9pt", margin: 0, lineHeight: 1.3 }}>{product.name}</p>
                        {product.sku && (
                          <p style={{ fontSize: "7pt", color: "#888", margin: "1px 0 0" }}>SKU: {product.sku}</p>
                        )}
                        {product.model && (
                          <p style={{ fontSize: "7pt", color: "#888", margin: "1px 0 0" }}>Model: {product.model}</p>
                        )}
                        {product.color && (
                          <p style={{ fontSize: "7pt", color: "#888", margin: "1px 0 0" }}>Color: {product.color}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "3mm 4mm", textAlign: "center", fontSize: "9pt", verticalAlign: "top" }}>{item.quantity}</td>
                  <td style={{ padding: "3mm 4mm", textAlign: "right", fontSize: "9pt", verticalAlign: "top" }}>{formatPrice(product.price)}</td>
                  <td style={{ padding: "3mm 4mm", textAlign: "right", fontSize: "9pt", fontWeight: 600, verticalAlign: "top" }}>
                    {formatPrice(product.price * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6mm" }}>
        <div style={{ width: "70mm" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2mm 0", fontSize: "9pt" }}>
            <span style={{ color: "#555" }}>Subtotal:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2mm 0", fontSize: "9pt", color: "#16a34a" }}>
              <span>Discount ({order.discount}%):</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3mm 0", borderTop: "2px solid #1a1a1a", fontWeight: 700, fontSize: "13pt" }}>
            <span>TOTAL:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Tips & Safety */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5mm", marginBottom: "5mm" }}>
        <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "4mm 5mm" }}>
          <h4 style={{ fontSize: "8pt", fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3mm", borderBottom: "1px solid #eee", paddingBottom: "2mm" }}>
            📋 Usage Tips
          </h4>
          <ul style={{ fontSize: "7.5pt", color: "#555", margin: 0, paddingLeft: "4mm", lineHeight: 1.8 }}>
            <li>Always use the original charger supplied with your device.</li>
            <li>Allow proper ventilation — do not block air vents.</li>
            <li>Shut down properly; avoid forced shutdowns.</li>
            <li>Keep your operating system & drivers updated.</li>
            <li>Use a surge protector to prevent power damage.</li>
            <li>Clean the screen with a soft microfiber cloth only.</li>
          </ul>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "4mm 5mm" }}>
          <h4 style={{ fontSize: "8pt", fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 3mm", borderBottom: "1px solid #eee", paddingBottom: "2mm" }}>
            ⚠️ Safety & Warranty
          </h4>
          <ul style={{ fontSize: "7.5pt", color: "#555", margin: 0, paddingLeft: "4mm", lineHeight: 1.8 }}>
            <li>Do not expose your device to extreme heat or moisture.</li>
            <li>Keep liquids away from your laptop at all times.</li>
            <li>Warranty is void if opened by unauthorized persons.</li>
            <li>Report any defects within 7 days of purchase.</li>
            <li>Retain this invoice as proof of purchase for warranty.</li>
            <li>For support, call: <strong>+256 705 154 828</strong></li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: "4mm", marginTop: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "7.5pt", color: "#888" }}>
            <p style={{ margin: 0 }}>Computer-generated invoice.</p>
            <p style={{ margin: "1px 0 0" }}>No signature required.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "9pt", fontWeight: 600, color: "#333", margin: 0 }}>Thank you for choosing Eco Print Technologies!</p>
            <p style={{ fontSize: "7pt", color: "#999", margin: "2px 0 0" }}>Powered by Kabejja Systems — www.kabejjasystems.store</p>
          </div>
          <div style={{ fontSize: "7.5pt", color: "#888", textAlign: "right" }}>
            <p style={{ margin: 0 }}>Ref: {order.order_number}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default A4Receipt;
