import { forwardRef } from "react";

interface ProductManualProps {
  product: {
    name: string;
    price: number;
    original_price?: number | null;
    sku?: string | null;
    model?: string | null;
    color?: string | null;
    description?: string | null;
    image_url?: string | null;
    images?: string[] | null;
    brands?: { name: string } | null;
    categories?: { name: string } | null;
    stock_quantity?: number | null;
  };
  specs?: { spec_key: string; spec_value: string }[];
}

const ProductManual = forwardRef<HTMLDivElement, ProductManualProps>(
  ({ product, specs }, ref) => {
    const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        minimumFractionDigits: 0,
      }).format(price);

    const imageUrl = product.image_url || product.images?.[0] || "";

    return (
      <div
        ref={ref}
        className="product-manual bg-white text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          padding: "12mm 16mm",
          fontFamily: "'Segoe UI', Arial, sans-serif",
          fontSize: "11px",
          lineHeight: "1.4",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "3px solid #1a1a1a",
            paddingBottom: "8px",
            marginBottom: "12px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
              ECO PRINT TECHNOLOGIES
            </h1>
            <p style={{ fontSize: "9px", margin: "2px 0 0", color: "#555" }}>
              Laptops & Tech Services | Suncity Mall, Kampala
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "9px", color: "#555" }}>
            <p style={{ margin: 0 }}>Tel: +256 705 154 828</p>
            <p style={{ margin: 0 }}>ecoprintug.com</p>
          </div>
        </div>

        {/* Product Title */}
        <div
          style={{
            background: "#f5f5f5",
            padding: "10px 14px",
            borderRadius: "6px",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{product.name}</h2>
          <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "10px", color: "#666" }}>
            {product.brands?.name && <span>Brand: <strong>{product.brands.name}</strong></span>}
            {product.categories?.name && <span>Category: <strong>{product.categories.name}</strong></span>}
            {product.sku && <span>SKU: <strong>{product.sku}</strong></span>}
          </div>
        </div>

        {/* Image + Quick Info */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "12px" }}>
          {imageUrl && (
            <div
              style={{
                width: "140px",
                height: "140px",
                flexShrink: 0,
                border: "1px solid #ddd",
                borderRadius: "6px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fafafa",
              }}
            >
              <img
                src={imageUrl}
                alt={product.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                crossOrigin="anonymous"
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            {/* Price Box */}
            <div
              style={{
                background: "#1a1a1a",
                color: "white",
                padding: "10px 14px",
                borderRadius: "6px",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 800 }}>
                {formatPrice(product.price)}
              </div>
              {product.original_price && (
                <div style={{ fontSize: "11px", textDecoration: "line-through", opacity: 0.7 }}>
                  Was {formatPrice(product.original_price)}
                </div>
              )}
            </div>

            {/* Quick Specs */}
            <div style={{ fontSize: "10px" }}>
              {product.model && (
                <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                  <span style={{ color: "#888", minWidth: "50px" }}>Model:</span>
                  <strong>{product.model}</strong>
                </div>
              )}
              {product.color && (
                <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                  <span style={{ color: "#888", minWidth: "50px" }}>Color:</span>
                  <strong>{product.color}</strong>
                </div>
              )}
              <div style={{ display: "flex", gap: "4px" }}>
                <span style={{ color: "#888", minWidth: "50px" }}>Status:</span>
                <strong style={{ color: (product.stock_quantity || 0) > 0 ? "#16a34a" : "#dc2626" }}>
                  {(product.stock_quantity || 0) > 0 ? "In Stock" : "Out of Stock"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        {specs && specs.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                borderBottom: "2px solid #1a1a1a",
                paddingBottom: "4px",
                marginBottom: "6px",
              }}
            >
              Technical Specifications
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10px",
              }}
            >
              <tbody>
                {specs.map((spec, idx) => (
                  <tr
                    key={idx}
                    style={{
                      background: idx % 2 === 0 ? "#f9f9f9" : "white",
                    }}
                  >
                    <td
                      style={{
                        padding: "4px 8px",
                        fontWeight: 600,
                        width: "35%",
                        color: "#444",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {spec.spec_key}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {spec.spec_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                borderBottom: "2px solid #1a1a1a",
                paddingBottom: "4px",
                marginBottom: "6px",
              }}
            >
              Product Description
            </h3>
            <p style={{ fontSize: "10px", color: "#333", margin: 0, whiteSpace: "pre-line" }}>
              {product.description}
            </p>
          </div>
        )}

        {/* Important Information */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "10px 14px",
            marginBottom: "12px",
            fontSize: "9px",
          }}
        >
          <h3 style={{ fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
            Important Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
            <div>
              <strong>Warranty:</strong> 6 months warranty on all laptops. Covers hardware defects only.
            </div>
            <div>
              <strong>Returns:</strong> Items can be returned within 7 days if in original condition.
            </div>
            <div>
              <strong>Support:</strong> Free technical support for 30 days after purchase.
            </div>
            <div>
              <strong>Delivery:</strong> Kampala delivery from UGX 5,000. Upcountry rates vary.
            </div>
          </div>
        </div>

        {/* Care Tips */}
        <div style={{ marginBottom: "12px", fontSize: "9px" }}>
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3px",
              marginBottom: "5px",
            }}
          >
            Care & Maintenance Tips
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
            <p style={{ margin: "0" }}>• Keep your laptop on a flat, hard surface for proper ventilation</p>
            <p style={{ margin: "0" }}>• Clean the screen with a soft, lint-free cloth</p>
            <p style={{ margin: "0" }}>• Avoid eating or drinking near your machine</p>
            <p style={{ margin: "0" }}>• Shut down properly — don't force power off</p>
            <p style={{ margin: "0" }}>• Keep software and antivirus up to date</p>
            <p style={{ margin: "0" }}>• Use a surge protector to prevent power damage</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "3px solid #1a1a1a",
            paddingTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "8px",
            color: "#888",
            position: "relative",
          }}
        >
          <div>
            <strong style={{ color: "#333" }}>Eco Print Technologies</strong> — Your Trusted Tech Partner
          </div>
          <div style={{ textAlign: "right" }}>
            <span>Suncity Mall, Kampala | +256 705 154 828</span>
          </div>
        </div>
      </div>
    );
  }
);

ProductManual.displayName = "ProductManual";

export default ProductManual;
