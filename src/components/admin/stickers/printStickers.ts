import { StickerData } from "./types";

export const printStickers = (stickers: StickerData[]) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  const count = stickers.length;
  const stickerWidth = count === 1 ? "210mm" : count === 2 ? "105mm" : "70mm";
  const fs = (base: number) => count === 3 ? `${base * 0.75}pt` : `${base}pt`;

  const renderQR = (url: string, size: number) => {
    // Use a Google Charts QR API for print since we can't render React in print window
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
          .sticker {
            width: ${stickerWidth};
            height: 297mm;
            border-right: 1px dashed #ccc;
            padding: 6mm 4mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
          }
          .sticker:last-child { border-right: none; }
          .brand-logo { margin: 2mm 0; }
          .brand-logo img { max-height: ${count === 3 ? "18mm" : "24mm"}; max-width: 80%; object-fit: contain; }
          .brand-title { font-weight: bold; font-size: ${fs(16)}; margin-top: 2mm; text-align: center; }
          .product-model { font-size: ${fs(10)}; margin-top: 1mm; text-align: center; }
          .serial-info { font-size: ${fs(6)}; margin-top: 1mm; text-align: center; color: #444; }
          .specs-table { width: 92%; margin-top: 4mm; border-collapse: collapse; }
          .specs-table td { padding: 1.2mm 2mm; font-size: ${fs(8)}; font-weight: bold; vertical-align: top; }
          .spec-key { width: 38%; }
          .separator { width: 60%; border: none; border-top: 1px solid #000; margin-top: 3mm; }
          .disclaimers { margin-top: 3mm; font-size: ${fs(5.5)}; line-height: 1.35; width: 92%; text-align: left; color: #333; }
          .footer { margin-top: auto; padding-bottom: 3mm; width: 92%; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
          .footer-images { display: flex; align-items: center; justify-content: center; gap: 3mm; flex-wrap: wrap; }
          .footer-img { display: flex; flex-direction: column; align-items: center; }
          .footer-img img { height: ${count === 3 ? "8mm" : "12mm"}; object-fit: contain; }
          .footer-img span { font-size: 4pt; color: #666; margin-top: 0.5mm; }
          .footer-text { font-size: 5.5pt; color: #555; text-align: center; white-space: pre-wrap; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${stickers.map(sticker => `
          <div class="sticker">
            ${sticker.showBrandLogo && sticker.brandLogoUrl ? `
              <div class="brand-logo"><img src="${sticker.brandLogoUrl}" /></div>
            ` : ""}
            <div class="brand-title">${sticker.brandName.toUpperCase()} ${sticker.productType}</div>
            <div class="product-model">${sticker.productModel}</div>
            ${sticker.serialNumber || sticker.typeCode ? `
              <div class="serial-info">
                ${sticker.serialNumber ? `S/N ${sticker.serialNumber}` : ""}
                ${sticker.typeCode ? `<br/>TYPE ${sticker.typeCode}` : ""}
              </div>
            ` : ""}
            <table class="specs-table">
              ${sticker.specs.filter(s => s.key && s.value).map(spec => `
                <tr><td class="spec-key">${spec.key}</td><td>${spec.value}</td></tr>
              `).join("")}
            </table>
            ${sticker.disclaimers ? `
              <hr class="separator" />
              <div class="disclaimers">${sticker.disclaimers.replace(/\n/g, "<br/>")}</div>
            ` : ""}
            <div class="footer">
              ${sticker.footerImages.length > 0 || (sticker.showQrCode && sticker.qrCodeUrl) ? `
                <div class="footer-images">
                  ${sticker.footerImages.map(fi => `
                    <div class="footer-img">
                      ${fi.url ? `<img src="${fi.url}" />` : ""}
                      ${fi.label ? `<span>${fi.label}</span>` : ""}
                    </div>
                  `).join("")}
                  ${sticker.showQrCode && sticker.qrCodeUrl ? renderQR(sticker.qrCodeUrl, count === 3 ? 28 : 40) : ""}
                </div>
              ` : ""}
              ${sticker.footerText ? `<div class="footer-text">${sticker.footerText}</div>` : ""}
            </div>
          </div>
        `).join("")}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 400);
  return true;
};
