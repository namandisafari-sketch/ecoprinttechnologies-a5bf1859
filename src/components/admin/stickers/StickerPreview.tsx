import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { StickerData } from "./types";

interface StickerPreviewProps {
  stickers: StickerData[];
}

const StickerPreview = forwardRef<HTMLDivElement, StickerPreviewProps>(({ stickers }, ref) => {
  const count = stickers.length;
  const stickerWidth = count === 1 ? "210mm" : count === 2 ? "105mm" : "70mm";
  const fontSize = (base: number) => count === 3 ? `${base * 0.75}pt` : `${base}pt`;

  return (
    <div
      ref={ref}
      className="bg-white border border-border mx-auto"
      style={{
        width: "210mm",
        height: "297mm",
        display: "flex",
        overflow: "hidden",
        transform: "scale(0.4)",
        transformOrigin: "top center",
      }}
    >
      {stickers.map((sticker, idx) => (
        <div
          key={idx}
          style={{
            width: stickerWidth,
            height: "297mm",
            borderRight: idx < count - 1 ? "1px dashed #ccc" : "none",
            padding: "6mm 4mm",
            fontFamily: "Arial, Helvetica, sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "hidden",
            color: "#000",
          }}
        >
          {/* Brand Logo */}
          {sticker.showBrandLogo && sticker.brandLogoUrl && (
            <div style={{ marginTop: "2mm", marginBottom: "2mm" }}>
              <img
                src={sticker.brandLogoUrl}
                alt="brand"
                style={{ maxHeight: count === 3 ? "18mm" : "24mm", maxWidth: "80%", objectFit: "contain" }}
              />
            </div>
          )}

          {/* Brand Name & Product Type */}
          <div style={{ fontWeight: "bold", fontSize: fontSize(16), marginTop: "2mm", textAlign: "center" }}>
            {sticker.brandName.toUpperCase() || "BRAND"} {sticker.productType || "LAPTOP"}
          </div>
          <div style={{ fontSize: fontSize(10), marginTop: "1mm", textAlign: "center" }}>
            {sticker.productModel || "Model Name"}
          </div>

          {/* Serial / Type */}
          {(sticker.serialNumber || sticker.typeCode) && (
            <div style={{ fontSize: fontSize(6), marginTop: "1mm", textAlign: "center", color: "#444" }}>
              {sticker.serialNumber && <div>S/N {sticker.serialNumber}</div>}
              {sticker.typeCode && <div>TYPE {sticker.typeCode}</div>}
            </div>
          )}

          {/* Specs Table */}
          <table style={{ width: "92%", marginTop: "4mm", borderCollapse: "collapse" }}>
            <tbody>
              {sticker.specs.filter(s => s.key && s.value).map((spec, si) => (
                <tr key={si}>
                  <td style={{ padding: "1.2mm 2mm", fontSize: fontSize(8), fontWeight: "bold", width: "38%", verticalAlign: "top" }}>{spec.key}</td>
                  <td style={{ padding: "1.2mm 2mm", fontSize: fontSize(8), fontWeight: "bold", verticalAlign: "top" }}>{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Disclaimers */}
          {sticker.disclaimers && (
            <>
              <hr style={{ width: "60%", border: "none", borderTop: "1px solid #000", marginTop: "3mm" }} />
              <div style={{
                marginTop: "3mm",
                fontSize: fontSize(5.5),
                lineHeight: "1.35",
                width: "92%",
                textAlign: "left",
                color: "#333",
                whiteSpace: "pre-wrap",
              }}>
                {sticker.disclaimers}
              </div>
            </>
          )}

          {/* Footer section: QR + images + text */}
          <div style={{ marginTop: "auto", paddingBottom: "3mm", width: "92%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm" }}>
            {/* Footer images row */}
            {(sticker.footerImages.length > 0 || sticker.showQrCode) && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3mm", flexWrap: "wrap" }}>
                {sticker.footerImages.map((fi, fiIdx) => (
                  <div key={fiIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {fi.url && <img src={fi.url} alt={fi.label} style={{ height: count === 3 ? "8mm" : "12mm", objectFit: "contain" }} />}
                    {fi.label && <span style={{ fontSize: "4pt", color: "#666", marginTop: "0.5mm" }}>{fi.label}</span>}
                  </div>
                ))}
                {sticker.showQrCode && sticker.qrCodeUrl && (
                  <QRCodeSVG value={sticker.qrCodeUrl} size={count === 3 ? 28 : 40} level="M" />
                )}
              </div>
            )}

            {/* Footer text */}
            {sticker.footerText && (
              <div style={{ fontSize: "5.5pt", color: "#555", textAlign: "center", whiteSpace: "pre-wrap" }}>
                {sticker.footerText}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

StickerPreview.displayName = "StickerPreview";

export default StickerPreview;
