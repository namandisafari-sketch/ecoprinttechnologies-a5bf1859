/**
 * Adds a semi-transparent watermark logo to an image file using Canvas API.
 * Returns a new File with the watermark applied.
 */
export const addWatermark = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const logo = new Image();

    img.onload = () => {
      logo.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Calculate watermark size (35% of the shorter dimension to compensate for logo whitespace)
        const shortSide = Math.min(img.width, img.height);
        const logoSize = Math.max(shortSide * 0.35, 80);
        const aspectRatio = logo.width / logo.height;
        const logoW = logoSize * aspectRatio;
        const logoH = logoSize;

        // Position: center of the image
        const x = (img.width - logoW) / 2;
        const y = (img.height - logoH) / 2;

        // Draw with transparency
        ctx.globalAlpha = 0.3;
        ctx.drawImage(logo, x, y, logoW, logoH);
        ctx.globalAlpha = 1.0;

        // Convert back to file
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to create watermarked image"));
            const watermarkedFile = new File([blob], file.name, {
              type: "image/png",
              lastModified: Date.now(),
            });
            resolve(watermarkedFile);
          },
          "image/png",
          0.92
        );
      };

      logo.onerror = () => {
        // If logo fails to load, return original file
        console.warn("Watermark logo failed to load, skipping watermark");
        resolve(file);
      };

      logo.crossOrigin = "anonymous";
      logo.src = "/watermark-logo.png";
    };

    img.onerror = () => reject(new Error("Failed to load image for watermarking"));

    // Read the file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};
