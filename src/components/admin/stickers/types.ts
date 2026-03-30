export interface StickerSpec {
  key: string;
  value: string;
}

export interface FooterImage {
  url: string;
  label: string;
}

export interface StickerLayout {
  stickerWidthMm: number;
  logoMaxHeightMm: number;
  titleFontPt: number;
  modelFontPt: number;
  specFontPt: number;
  disclaimerFontPt: number;
  paddingTopMm: number;
  paddingHorizontalMm: number;
  textAlign: "left" | "center" | "right";
  specsAlign: "left" | "center";
  footerAlign: "left" | "center" | "right";
}

export interface StickerData {
  brandName: string;
  brandLogoUrl: string;
  showBrandLogo: boolean;
  productType: string;
  productModel: string;
  serialNumber: string;
  typeCode: string;
  specs: StickerSpec[];
  disclaimers: string;
  showQrCode: boolean;
  qrCodeUrl: string;
  footerImages: FooterImage[];
  footerText: string;
  layout: StickerLayout;
}

export const DEFAULT_LAYOUT: StickerLayout = {
  stickerWidthMm: 70,
  logoMaxHeightMm: 22,
  titleFontPt: 16,
  modelFontPt: 10,
  specFontPt: 8,
  disclaimerFontPt: 5.5,
  paddingTopMm: 6,
  paddingHorizontalMm: 4,
  textAlign: "center",
  specsAlign: "left",
  footerAlign: "center",
};

export const DEFAULT_DISCLAIMERS = `For storage drive, GB a billion bytes TB =1 trillion bytes. Actual formatted capacity is less. Up to 35GB of system disk is reserved for system recovery software.
[4] Maximum memory capacities assume Windows 64-bit operating systems or Linux with Windows 32-bit operating systems, memory above 3GB may not be available due to system resource requirements.
[8] Not all features are available in all editions or versions of Windows Systems may require upgraded and/or separately purchased hardware, drivers, software or BIOS update to take full advantage of Windows functionality.`;

export const DEFAULT_SPECS: StickerSpec[] = [
  { key: "Processor", value: "" },
  { key: "Speed", value: "" },
  { key: "RAM", value: "" },
  { key: "Storage", value: "" },
  { key: "Graphics", value: "" },
  { key: "Display", value: "" },
  { key: "Color", value: "" },
];

export const emptyStickerData = (): StickerData => ({
  brandName: "",
  brandLogoUrl: "",
  showBrandLogo: true,
  productType: "LAPTOP",
  productModel: "",
  serialNumber: "",
  typeCode: "",
  specs: DEFAULT_SPECS.map(s => ({ ...s })),
  disclaimers: DEFAULT_DISCLAIMERS,
  showQrCode: true,
  qrCodeUrl: "",
  footerImages: [],
  footerText: "Kabejja Technologies",
  layout: { ...DEFAULT_LAYOUT },
});
