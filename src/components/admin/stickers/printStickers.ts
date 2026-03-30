import { StickerData } from "./types";

export const printStickers = (stickers: StickerData[]) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  const renderQR = (url: string, size: number) => {
    return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}" style="width:${size}px;height:${size}px;" />`;
  };

  printWindow.document.write(`
    <html>
      <head>
        <title>Product Stickers</title>
        <style>
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 210mm; height: 297mm; display: flex; font-family: Arial, Helvetica, sans-serif; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          .sticker { border: 1px dashed #999; }
          .sticker + .sticker { border-left: 1px dashed #999; }
        </style>
      </head>
      <body>
        ${stickers.map((sticker, idx) => {
          const L = sticker.layout;
          const footerAlignFlex = L.footerAlign === "left" ? "flex-start" : L.footerAlign === "right" ? "flex-end" : "center";
          const titleAlignFlex = L.textAlign === "left" ? "flex-start" : L.textAlign === "right" ? "flex-end" : "center";
          return `
          <div class="sticker" style="width:${L.stickerWidthMm}mm;height:297mm;padding:${L.paddingTopMm}mm ${L.paddingHorizontalMm}mm;display:flex;flex-direction:column;align-items:${titleAlignFlex};overflow:hidden;">
            ${sticker.showBrandLogo && sticker.brandLogoUrl ? `
              <div style="margin:2mm 0;"><img src="${sticker.brandLogoUrl}" style="max-height:${L.logoMaxHeightMm}mm;max-width:80%;object-fit:contain;" /></div>
            ` : ""}
            <div style="font-weight:bold;font-size:${L.titleFontPt}pt;margin-top:2mm;text-align:${L.textAlign};">${sticker.brandName.toUpperCase()} ${sticker.productType}</div>
            <div style="font-size:${L.modelFontPt}pt;margin-top:1mm;text-align:${L.textAlign};">${sticker.productModel}</div>
            ${sticker.serialNumber || sticker.typeCode ? `
              <div style="font-size:${L.specFontPt * 0.75}pt;margin-top:1mm;text-align:${L.textAlign};color:#444;">
                ${sticker.serialNumber ? `S/N ${sticker.serialNumber}` : ""}
                ${sticker.typeCode ? `<br/>TYPE ${sticker.typeCode}` : ""}
              </div>
            ` : ""}
            <table style="width:92%;margin-top:4mm;border-collapse:collapse;text-align:${L.specsAlign};">
              ${sticker.specs.filter(s => s.key && s.value).map(spec => `
                <tr><td style="padding:1.2mm 2mm;font-size:${L.specFontPt}pt;font-weight:bold;width:38%;vertical-align:top;">${spec.key}</td><td style="padding:1.2mm 2mm;font-size:${L.specFontPt}pt;font-weight:bold;vertical-align:top;">${spec.value}</td></tr>
              `).join("")}
            </table>
            ${sticker.disclaimers ? `
              <hr style="width:60%;border:none;border-top:1px solid #000;margin-top:3mm;" />
              <div style="margin-top:3mm;font-size:${L.disclaimerFontPt}pt;line-height:1.35;width:92%;text-align:left;color:#333;">${sticker.disclaimers.replace(/\n/g, "<br/>")}</div>
            ` : ""}
            <div style="margin-top:auto;padding-bottom:3mm;width:92%;display:flex;align-items:center;justify-content:${footerAlignFlex};gap:${L.footerGapMm}mm;flex-wrap:wrap;">
              ${sticker.footerImages.map(fi => `
                <div style="display:flex;flex-direction:column;align-items:center;">
                  ${fi.url ? `<img src="${fi.url}" style="height:${L.footerImageHeightMm}mm;object-fit:contain;" />` : ""}
                  ${fi.label ? `<span style="font-size:4pt;color:#666;margin-top:0.5mm;">${fi.label}</span>` : ""}
                </div>
              `).join("")}
              ${sticker.showQrCode && sticker.qrCodeUrl ? renderQR(sticker.qrCodeUrl, 40) : ""}
              ${sticker.footerText ? `<div style="font-size:5.5pt;color:#555;white-space:pre-wrap;text-align:left;">${sticker.footerText}</div>` : ""}
            </div>
          </div>
        `}).join("")}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 400);
  return true;
};
