import { StickerData, DEFAULT_LAYOUT, DEFAULT_DISCLAIMERS } from "./types";
import hpLogo from "@/assets/stickers/hp-logo.jpg";
import dellLogo from "@/assets/stickers/dell-logo.jpg";
import lenovoLogo from "@/assets/stickers/lenovo-logo.png";
import energyStar from "@/assets/stickers/energy-star.jpg";
import lenovoEnergyStar from "@/assets/stickers/lenovo-energy-star.jpg";
import tcoCertified from "@/assets/stickers/tco-certified.jpg";
import e3Logo from "@/assets/stickers/e3-logo.jpg";
import weeeSymbol from "@/assets/stickers/weee-symbol.jpg";

export interface BuiltInTemplate {
  id: string;
  name: string;
  brand: "HP" | "DELL" | "LENOVO";
  build: () => StickerData;
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: "builtin-hp",
    name: "HP Laptop (Default)",
    brand: "HP",
    build: () => ({
      brandName: "HP",
      brandLogoUrl: hpLogo,
      showBrandLogo: true,
      productType: "LAPTOP",
      productModel: "HP ProBook 445 G9",
      serialNumber: "",
      typeCode: "",
      specs: [
        { key: "Processor", value: "AMD Ryzen5675U" },
        { key: "Speed", value: "2.30GHz" },
        { key: "RAM", value: "DDR4-16GB" },
        { key: "Storage", value: "1TB SSD" },
        { key: "Graphics", value: "AMD Radeon Graphics" },
        { key: "Display", value: '14"FHD' },
        { key: "Color", value: "Silver" },
      ],
      disclaimers: DEFAULT_DISCLAIMERS,
      showQrCode: true,
      qrCodeUrl: "https://www.hp.com",
      footerImages: [
        { url: energyStar, label: "" },
      ],
      footerText: "Made in China",
      complianceId: "TPN-C 139",
      poCode: "PRM: TPN-C 139\nRATT: HSTMNLDRRS",
      layout: { ...DEFAULT_LAYOUT, footerLayout: "row", textAlign: "center", specsAlign: "left" },
    }),
  },
  {
    id: "builtin-dell",
    name: "Dell Latitude (Default)",
    brand: "DELL",
    build: () => ({
      brandName: "DELL",
      brandLogoUrl: dellLogo,
      showBrandLogo: true,
      productType: "LAPTOP",
      productModel: "Dell Latitude 5540",
      serialNumber: "",
      typeCode: "",
      specs: [
        { key: "Processor", value: "Intel® Core ™ i5-1345U" },
        { key: "Speed", value: "1.30GHz" },
        { key: "Memory", value: "DDR5-16GB" },
        { key: "Storage", value: "512GB" },
        { key: "Graphics", value: "Intel UHD Graphics" },
        { key: "Optical Drive", value: "N/A" },
        { key: "Screen Size", value: '15.6"' },
        { key: "Color", value: "Gray" },
        { key: "OS", value: "Windows 11pro" },
      ],
      disclaimers: "",
      showQrCode: false,
      qrCodeUrl: "",
      footerImages: [
        { url: e3Logo, label: "" },
        { url: weeeSymbol, label: "" },
      ],
      footerText: "Made in China",
      complianceId: "",
      poCode: "",
      layout: { ...DEFAULT_LAYOUT, footerLayout: "row", textAlign: "left", specsAlign: "left" },
    }),
  },
  {
    id: "builtin-lenovo",
    name: "Lenovo ThinkPad (Default)",
    brand: "LENOVO",
    build: () => ({
      brandName: "LENOVO",
      brandLogoUrl: lenovoLogo,
      showBrandLogo: true,
      productType: "",
      productModel: "ThinkPad T14s Gen3",
      serialNumber: "PC-GM01JLPF",
      typeCode: "20WN-S16S0H",
      specs: [
        { key: "Processor", value: "Intel® Core™ i7-1270P" },
        { key: "Speed", value: "2.20GHz" },
        { key: "RAM", value: "DDR5-16GB" },
        { key: "Storage", value: "512GB SSD" },
        { key: "Graphics", value: "Intel® Iris® Xe Graphics" },
        { key: "Display", value: '14"' },
        { key: "Color", value: "Matt Black" },
      ],
      disclaimers: "",
      showQrCode: true,
      qrCodeUrl: "https://www.lenovo.com",
      footerImages: [
        { url: lenovoEnergyStar, label: "" },
        { url: tcoCertified, label: "" },
      ],
      footerText: "",
      complianceId: "",
      poCode: "PO: 7520787279-00010\nQT: 12-30.\nUG-2C05-1",
      layout: { ...DEFAULT_LAYOUT, footerLayout: "grid", textAlign: "left", specsAlign: "left" },
    }),
  },
];
