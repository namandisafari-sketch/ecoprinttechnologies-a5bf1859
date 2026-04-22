import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { StickerData } from "./types";

interface StickerPreviewProps {
  stickers: StickerData[];
}

/** Renders one sticker body inside a fixed-height container (mm). */
const SingleStickerBody = ({ sticker, heightMm }: { sticker: StickerData; heightMm: number }) => {
  const L = sticker.layout;
  return (
    <div
      style={{
        width: "100%",
        height: `${heightMm}mm`,
        padding: `${L.paddingTopMm}mm ${L.paddingHorizontalMm}mm`,
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: L.textAlign === "left" ? "flex-start" : L.textAlign === "right" ? "flex-end" : "center",
        overflow: "hidden",
        color: "#000",
        boxSizing: "border-box",
      }}
    >
      {sticker.showBrandLogo && sticker.brandLogoUrl && (
        <div style={{ marginTop: "2mm", marginBottom: "2mm" }}>
          <img
            src={sticker.brandLogoUrl}
            alt="brand"
            style={{ maxHeight: `${L.logoMaxHeightMm}mm`, maxWidth: "80%", objectFit: "contain" }}
          />
        </div>
      )}

      <div style={{ fontWeight: "bold", fontSize: `${L.titleFontPt}pt`, marginTop: "2mm", textAlign: L.textAlign }}>
        {sticker.brandName.toUpperCase() || "BRAND"} {sticker.productType || "LAPTOP"}
      </div>
      <div style={{ fontSize: `${L.modelFontPt}pt`, marginTop: "1mm", textAlign: L.textAlign }}>
        {sticker.productModel || "Model Name"}
      </div>

      {(sticker.serialNumber || sticker.typeCode) && (
        <div style={{ fontSize: `${L.specFontPt * 0.75}pt`, marginTop: "1mm", textAlign: L.textAlign, color: "#444" }}>
          {sticker.serialNumber && <div>S/N {sticker.serialNumber}</div>}
          {sticker.typeCode && <div>TYPE {sticker.typeCode}</div>}
        </div>
      )}

      <table style={{ width: "92%", marginTop: "4mm", borderCollapse: "collapse", textAlign: L.specsAlign }}>
        <tbody>
          {sticker.specs.filter(s => s.key && s.value).map((spec, si) => (
            <tr key={si}>
              <td style={{ padding: "1.2mm 2mm", fontSize: `${L.specFontPt}pt`, fontWeight: "bold", width: "38%", verticalAlign: "top" }}>{spec.key}</td>
              <td style={{ padding: "1.2mm 2mm", fontSize: `${L.specFontPt}pt`, fontWeight: "bold", verticalAlign: "top" }}>{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sticker.disclaimers && (
        <>
          <hr style={{ width: "60%", border: "none", borderTop: "1px solid #000", marginTop: "3mm" }} />
          <div style={{
            marginTop: "3mm",
            fontSize: `${L.disclaimerFontPt}pt`,
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

      {/* Spacer between body and footer.
          - If bodyFooterGapMm > 0, fixed gap is used
          - If 0, marginTop:auto on the footer pushes it to the bottom */}
      {L.bodyFooterGapMm > 0 && <div style={{ height: `${L.bodyFooterGapMm}mm`, flexShrink: 0 }} />}

      {L.footerLayout === "grid" ? (
        <div style={{
          marginTop: L.bodyFooterGapMm > 0 ? 0 : "auto",
          paddingBottom: "3mm",
          width: "92%",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: `${L.footerGapMm}mm` }}>
            <div>
              {sticker.showQrCode && sticker.qrCodeUrl && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <QRCodeSVG value={sticker.qrCodeUrl} size={50} level="M" />
                  {sticker.productModel && (
                    <span style={{ fontSize: "3.5pt", color: "#444", marginTop: "0.5mm", maxWidth: "18mm", lineHeight: "1.2", wordBreak: "break-word" }}>
                      {sticker.brandName ? `${sticker.brandName} ` : ""}{sticker.productModel}
                    </span>
                  )}
                </div>
              )}
            </div>
            {sticker.footerImages.length > 0 && sticker.footerImages[0]?.url && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img src={sticker.footerImages[0].url} alt={sticker.footerImages[0].label} style={{ height: `${L.footerImageHeightMm}mm`, objectFit: "contain" }} />
                {sticker.footerImages[0].label && <span style={{ fontSize: "4pt", color: "#666", marginTop: "0.5mm" }}>{sticker.footerImages[0].label}</span>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: `${L.footerGapMm}mm` }}>
            {sticker.complianceId && (
              <div style={{ fontSize: "6pt", color: "#333" }}>
                <div style={{ fontWeight: "bold" }}>Compliance ID:</div>
                <div>{sticker.complianceId}</div>
              </div>
            )}
            {sticker.poCode && (
              <div style={{ fontSize: "6pt", color: "#333", textAlign: "right", whiteSpace: "pre-wrap" }}>
                {sticker.poCode}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: `${L.footerGapMm}mm`, flexWrap: "wrap" }}>
            {sticker.footerImages.slice(1).map((fi, fiIdx) => (
              <div key={fiIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {fi.url && <img src={fi.url} alt={fi.label} style={{ height: `${L.footerImageHeightMm}mm`, objectFit: "contain" }} />}
                {fi.label && <span style={{ fontSize: "4pt", color: "#666", marginTop: "0.5mm" }}>{fi.label}</span>}
              </div>
            ))}
            {sticker.footerText && (
              <div style={{ fontSize: "5.5pt", color: "#555", whiteSpace: "pre-wrap", textAlign: "left" }}>
                {sticker.footerText}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: L.bodyFooterGapMm > 0 ? 0 : "auto",
          paddingBottom: "3mm",
          width: "92%",
          display: "flex",
          alignItems: "center",
          justifyContent: L.footerAlign === "left" ? "flex-start" : L.footerAlign === "right" ? "flex-end" : "center",
          gap: `${L.footerGapMm}mm`,
          flexWrap: "wrap",
        }}>
          {sticker.footerImages.map((fi, fiIdx) => (
            <div key={fiIdx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {fi.url && <img src={fi.url} alt={fi.label} style={{ height: `${L.footerImageHeightMm}mm`, objectFit: "contain" }} />}
              {fi.label && <span style={{ fontSize: "4pt", color: "#666", marginTop: "0.5mm" }}>{fi.label}</span>}
            </div>
          ))}
          {sticker.showQrCode && sticker.qrCodeUrl && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <QRCodeSVG value={sticker.qrCodeUrl} size={40} level="M" />
              {sticker.productModel && (
                <span style={{ fontSize: "3.5pt", color: "#444", marginTop: "0.5mm", textAlign: "center", maxWidth: "15mm", lineHeight: "1.2", wordBreak: "break-word" }}>
                  {sticker.brandName ? `${sticker.brandName} ` : ""}{sticker.productModel}
                </span>
              )}
            </div>
          )}
          {sticker.footerText && (
            <div style={{ fontSize: "5.5pt", color: "#555", whiteSpace: "pre-wrap", textAlign: "left" }}>
              {sticker.footerText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StickerPreview = forwardRef<HTMLDivElement, StickerPreviewProps>(({ stickers }, ref) => {
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
      {stickers.map((sticker, idx) => {
        const L = sticker.layout;
        const splitTwoUp = !!L.splitTwoUp;
        const halfHeight = (297 - 2) / 2; // small allowance for separator
        return (
          <div
            key={idx}
            style={{
              width: `${L.stickerWidthMm}mm`,
              height: "297mm",
              borderRight: idx < stickers.length - 1 ? "1px dashed #999" : "none",
              borderLeft: "1px dashed #999",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {splitTwoUp ? (
              <>
                <SingleStickerBody sticker={sticker} heightMm={halfHeight} />
                <div style={{ borderTop: "1px dashed #999" }} />
                <SingleStickerBody sticker={sticker} heightMm={halfHeight} />
              </>
            ) : (
              <SingleStickerBody sticker={sticker} heightMm={297} />
            )}
          </div>
        );
      })}
    </div>
  );
});

StickerPreview.displayName = "StickerPreview";
export default StickerPreview;
