interface ThermalReceiptProps {
  order: any;
}

const ThermalReceipt = ({ order }: ThermalReceiptProps) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "2-digit" }),
      time: d.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  };

  const { date, time } = formatDate(order.created_at);
  const cashier = order.cashier_name || order.served_by || "—";

  return (
    <div
      className="receipt font-mono text-black bg-white"
      style={{ width: "80mm", padding: "6mm 4mm", fontSize: "11px", lineHeight: 1.45 }}
    >
      {/* ── Brand Header ─────────────────────────────────── */}
      <div className="text-center" style={{ marginBottom: "8px" }}>
        <div
          style={{
            display: "inline-block",
            border: "2px solid #000",
            borderRadius: "6px",
            padding: "4px 12px",
            marginBottom: "6px",
            fontWeight: 900,
            letterSpacing: "1px",
            fontSize: "13px",
          }}
        >
          ECO PRINT
        </div>
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px" }}>
          TECHNOLOGIES LTD
        </p>
        <p style={{ fontSize: "9px", marginTop: "3px" }}>F2-4 Suncity Plaza, Kampala Rd</p>
        <p style={{ fontSize: "9px" }}>Tel: +256 702 365 176 / +256 783 393 721</p>
        <p style={{ fontSize: "9px" }}>ecoprinttechnologies2020@gmail.com</p>
      </div>

      {/* Solid divider */}
      <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />

      {/* ── Receipt label ───────────────────────────────── */}
      <div className="text-center" style={{ marginBottom: "6px" }}>
        <p style={{ fontSize: "10px", letterSpacing: "3px", fontWeight: 700 }}>
          SALES RECEIPT
        </p>
      </div>

      {/* ── Meta block: 2-column grid ────────────────────── */}
      <div style={{ fontSize: "10px", marginBottom: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#444" }}>Receipt #</span>
          <span style={{ fontWeight: 700 }}>{order.order_number}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#444" }}>Date</span>
          <span>{date} • {time}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#444" }}>Cashier</span>
          <span style={{ fontWeight: 600 }}>{cashier}</span>
        </div>
        {order.customer_name && order.customer_name !== "Walk-in Customer" && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#444" }}>Customer</span>
            <span>{order.customer_name}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#444" }}>Payment</span>
          <span style={{ fontWeight: 600, textTransform: "uppercase" }}>
            {order.payment_method?.replace(/_/g, " ") || "CASH"}
          </span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ── Items header ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          paddingBottom: "3px",
          borderBottom: "1px solid #000",
        }}
      >
        <span>Item / Qty × Price</span>
        <span>Amount</span>
      </div>

      {/* ── Items ─────────────────────────────────────────── */}
      <div style={{ marginTop: "4px" }}>
        {order.items.map((item: any, index: number) => {
          const addons = item.addons || (item.product && item.product.addons) || [];
          const baseUnit = item.product.price;
          return (
            <div key={index} style={{ marginBottom: "6px" }}>
              <p style={{ fontWeight: 700, fontSize: "11px", marginBottom: "1px" }}>
                {item.product.name}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                }}
              >
                <span style={{ color: "#333" }}>
                  {item.quantity} × {formatPrice(baseUnit)}
                </span>
                <span style={{ fontWeight: 600 }}>
                  {formatPrice(baseUnit * item.quantity)}
                </span>
              </div>
              {addons.length > 0 && (
                <div style={{ paddingLeft: "8px", marginTop: "2px" }}>
                  {addons.map((a: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "9px",
                        color: "#333",
                      }}
                    >
                      <span>↳ {a.name}</span>
                      <span>+{formatPrice((Number(a.price) || 0) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

      {/* ── Totals ───────────────────────────────────────── */}
      <div style={{ fontSize: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Discount ({order.discount}%)</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        {order.tax > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span>Tax</span>
            <span>{formatPrice(order.tax)}</span>
          </div>
        )}
      </div>

      {/* GRAND TOTAL — bold inverted bar */}
      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "6px 8px",
          marginTop: "6px",
          marginBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 900,
          fontSize: "13px",
          letterSpacing: "0.5px",
        }}
      >
        <span>TOTAL</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      {order.amount_paid != null && order.amount_paid > 0 && (
        <div style={{ fontSize: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Paid</span>
            <span>{formatPrice(order.amount_paid)}</span>
          </div>
          {order.change_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Change</span>
              <span>{formatPrice(order.change_amount)}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: "2px solid #000", margin: "8px 0 6px" }} />

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="text-center" style={{ fontSize: "9px", lineHeight: 1.6 }}>
        <p style={{ fontWeight: 900, fontSize: "11px", letterSpacing: "2px" }}>
          ✓ THANK YOU
        </p>
        <p style={{ marginTop: "2px" }}>For shopping with us</p>
        <p style={{ marginTop: "6px", fontStyle: "italic" }}>
          Returns accepted within 7 days
        </p>
        <p>with original receipt</p>
        <p style={{ marginTop: "6px", letterSpacing: "1px", fontWeight: 600 }}>
          ecoprinttech.com
        </p>
        <p style={{ marginTop: "4px", fontSize: "8px", color: "#555" }}>
          Powered by Eco Print POS
        </p>
      </div>

      {/* End-of-receipt cut indicator */}
      <div className="text-center" style={{ marginTop: "8px", fontSize: "8px", color: "#888" }}>
        ✂ - - - - - - - - - - - - - - - - - - - -
      </div>
    </div>
  );
};

export default ThermalReceipt;
