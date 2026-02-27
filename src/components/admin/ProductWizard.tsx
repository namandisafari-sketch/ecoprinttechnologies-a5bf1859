import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addWatermark } from "@/lib/watermark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Upload, X, Plus, Trash2,
  Image as ImageIcon, GripVertical, Package, Tag, Settings2, Camera,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
interface Variant {
  id?: string;
  variant_name: string;
  sku: string;
  price: string;
  stock_quantity: string;
  attributes: Record<string, string>;
}

interface Specification {
  id?: string;
  spec_key: string;
  spec_value: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  original_price: string;
  category_id: string;
  brand_id: string;
  image_url: string;
  images: string[];
  sku: string;
  stock_quantity: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  color: string;
  model: string;
}

interface ProductWizardProps {
  editingProduct?: any;
  onClose: () => void;
}

// ── Category-specific spec templates ───────────────────────────────────
const CATEGORY_SPECS: Record<string, { key: string; placeholder: string }[]> = {
  laptops: [
    { key: "Processor (CPU)", placeholder: "e.g., Intel Core i7-13700H" },
    { key: "RAM", placeholder: "e.g., 16GB DDR5" },
    { key: "Storage", placeholder: "e.g., 512GB NVMe SSD" },
    { key: "GPU", placeholder: "e.g., NVIDIA RTX 4060" },
    { key: "Display", placeholder: "e.g., 15.6\" FHD IPS 144Hz" },
    { key: "Battery", placeholder: "e.g., 72Wh, up to 8hrs" },
    { key: "Operating System", placeholder: "e.g., Windows 11 Pro" },
    { key: "Weight", placeholder: "e.g., 1.8 kg" },
  ],
  phones: [
    { key: "Processor", placeholder: "e.g., Snapdragon 8 Gen 2" },
    { key: "RAM", placeholder: "e.g., 8GB" },
    { key: "Internal Storage", placeholder: "e.g., 256GB" },
    { key: "Display", placeholder: "e.g., 6.7\" AMOLED 120Hz" },
    { key: "Main Camera", placeholder: "e.g., 108MP + 12MP + 5MP" },
    { key: "Front Camera", placeholder: "e.g., 32MP" },
    { key: "Battery", placeholder: "e.g., 5000mAh, 67W fast charge" },
    { key: "OS", placeholder: "e.g., Android 14" },
    { key: "SIM", placeholder: "e.g., Dual SIM (Nano)" },
  ],
  accessories: [
    { key: "Connection Type", placeholder: "e.g., Bluetooth 5.3 / USB-C" },
    { key: "Material", placeholder: "e.g., Aluminum, Silicone" },
    { key: "Compatibility", placeholder: "e.g., iPhone, Samsung Galaxy" },
    { key: "Color Options", placeholder: "e.g., Black, White, Blue" },
    { key: "Weight", placeholder: "e.g., 45g" },
  ],
  tablets: [
    { key: "Processor", placeholder: "e.g., Apple M2" },
    { key: "RAM", placeholder: "e.g., 8GB" },
    { key: "Storage", placeholder: "e.g., 128GB" },
    { key: "Display", placeholder: "e.g., 11\" Liquid Retina" },
    { key: "Battery", placeholder: "e.g., 28.65Wh" },
    { key: "OS", placeholder: "e.g., iPadOS 17" },
  ],
  tvs: [
    { key: "Screen Size", placeholder: "e.g., 55 inches" },
    { key: "Resolution", placeholder: "e.g., 4K UHD (3840x2160)" },
    { key: "Display Technology", placeholder: "e.g., OLED / QLED / LED" },
    { key: "Refresh Rate", placeholder: "e.g., 120Hz" },
    { key: "HDR Support", placeholder: "e.g., HDR10+, Dolby Vision" },
    { key: "Smart TV OS", placeholder: "e.g., Tizen, webOS, Google TV" },
    { key: "Speakers", placeholder: "e.g., 20W, Dolby Atmos" },
    { key: "HDMI Ports", placeholder: "e.g., 3x HDMI 2.1" },
    { key: "USB Ports", placeholder: "e.g., 2x USB 2.0" },
    { key: "Wi-Fi", placeholder: "e.g., Wi-Fi 5 (802.11ac)" },
    { key: "Wall Mount (VESA)", placeholder: "e.g., 200x200mm" },
    { key: "Weight", placeholder: "e.g., 14.5 kg" },
  ],
  printers: [
    { key: "Printer Type", placeholder: "e.g., Inkjet / Laser / Thermal" },
    { key: "Print Speed", placeholder: "e.g., 30 ppm (mono), 15 ppm (color)" },
    { key: "Max Resolution", placeholder: "e.g., 4800x1200 dpi" },
    { key: "Duplex Printing", placeholder: "e.g., Automatic" },
    { key: "Paper Size", placeholder: "e.g., A4, A3, Letter" },
    { key: "Paper Tray Capacity", placeholder: "e.g., 250 sheets" },
    { key: "Scanner", placeholder: "e.g., Flatbed CIS, 1200x2400 dpi" },
    { key: "Connectivity", placeholder: "e.g., USB, Wi-Fi, Ethernet, AirPrint" },
    { key: "Ink/Toner Type", placeholder: "e.g., 4-color CMYK cartridge" },
    { key: "Monthly Duty Cycle", placeholder: "e.g., 15,000 pages" },
  ],
  audio: [
    { key: "Type", placeholder: "e.g., Over-ear / In-ear / Soundbar / Speaker" },
    { key: "Driver Size", placeholder: "e.g., 40mm" },
    { key: "Frequency Response", placeholder: "e.g., 20Hz–20kHz" },
    { key: "Impedance", placeholder: "e.g., 32 Ohm" },
    { key: "Connectivity", placeholder: "e.g., Bluetooth 5.3, 3.5mm, USB-C" },
    { key: "Battery Life", placeholder: "e.g., 30 hours" },
    { key: "Noise Cancellation", placeholder: "e.g., Active (ANC)" },
    { key: "Microphone", placeholder: "e.g., Built-in, noise-isolating" },
    { key: "Water Resistance", placeholder: "e.g., IPX4" },
    { key: "Weight", placeholder: "e.g., 250g" },
  ],
  monitors: [
    { key: "Screen Size", placeholder: "e.g., 27 inches" },
    { key: "Resolution", placeholder: "e.g., 2560x1440 (QHD)" },
    { key: "Panel Type", placeholder: "e.g., IPS / VA / TN / OLED" },
    { key: "Refresh Rate", placeholder: "e.g., 165Hz" },
    { key: "Response Time", placeholder: "e.g., 1ms (GtG)" },
    { key: "Adaptive Sync", placeholder: "e.g., FreeSync Premium / G-Sync" },
    { key: "Brightness", placeholder: "e.g., 350 nits" },
    { key: "Ports", placeholder: "e.g., 2x HDMI, 1x DP, 1x USB-C" },
    { key: "VESA Mount", placeholder: "e.g., 100x100mm" },
    { key: "Adjustable Stand", placeholder: "e.g., Tilt, Swivel, Height, Pivot" },
  ],
  desktops: [
    { key: "Processor (CPU)", placeholder: "e.g., Intel Core i9-14900K" },
    { key: "RAM", placeholder: "e.g., 32GB DDR5 5600MHz" },
    { key: "Storage", placeholder: "e.g., 1TB NVMe SSD + 2TB HDD" },
    { key: "GPU", placeholder: "e.g., NVIDIA RTX 4070 Ti" },
    { key: "Motherboard", placeholder: "e.g., Intel Z790 chipset" },
    { key: "Power Supply", placeholder: "e.g., 750W 80+ Gold" },
    { key: "Case", placeholder: "e.g., Mid-Tower ATX" },
    { key: "Operating System", placeholder: "e.g., Windows 11 Pro" },
    { key: "Cooling", placeholder: "e.g., 240mm AIO liquid cooler" },
    { key: "Ports", placeholder: "e.g., 4x USB 3.2, 2x USB-C, HDMI, DP" },
  ],
  networking: [
    { key: "Type", placeholder: "e.g., Router / Switch / Access Point" },
    { key: "Wi-Fi Standard", placeholder: "e.g., Wi-Fi 6E (802.11ax)" },
    { key: "Speed", placeholder: "e.g., AX5400 (5400 Mbps)" },
    { key: "Ethernet Ports", placeholder: "e.g., 4x Gigabit LAN, 1x WAN" },
    { key: "Antennas", placeholder: "e.g., 6x external" },
    { key: "Coverage", placeholder: "e.g., Up to 2,500 sq ft" },
    { key: "Security", placeholder: "e.g., WPA3, SPI Firewall" },
    { key: "USB Ports", placeholder: "e.g., 1x USB 3.0" },
  ],
  batteries: [
    { key: "Battery Type", placeholder: "e.g., Li-ion / Li-Po" },
    { key: "Capacity", placeholder: "e.g., 5000mAh / 68Wh" },
    { key: "Voltage", placeholder: "e.g., 11.4V" },
    { key: "Cells", placeholder: "e.g., 6-cell" },
    { key: "Compatibility", placeholder: "e.g., Dell Latitude 5520, 5530" },
    { key: "Part Number", placeholder: "e.g., OEM P/N 3HWPP" },
    { key: "Warranty", placeholder: "e.g., 12 months" },
  ],
  chargers: [
    { key: "Wattage", placeholder: "e.g., 65W / 90W / 100W" },
    { key: "Input", placeholder: "e.g., 100-240V AC, 50-60Hz" },
    { key: "Output", placeholder: "e.g., 20V 3.25A" },
    { key: "Connector Type", placeholder: "e.g., USB-C / Barrel / MagSafe" },
    { key: "Cable Length", placeholder: "e.g., 1.8m" },
    { key: "Compatibility", placeholder: "e.g., HP, Lenovo, Dell laptops" },
    { key: "Fast Charging", placeholder: "e.g., PD 3.0, QC 4.0" },
  ],
  "spare-parts": [
    { key: "Part Type", placeholder: "e.g., Screen / Keyboard / Fan / Hinge" },
    { key: "Compatibility", placeholder: "e.g., Lenovo ThinkPad T480, T480s" },
    { key: "Part Number", placeholder: "e.g., FRU 01YR503" },
    { key: "Condition", placeholder: "e.g., New / Refurbished / OEM" },
    { key: "Warranty", placeholder: "e.g., 6 months" },
  ],
  storage: [
    { key: "Type", placeholder: "e.g., SSD / HDD / USB Flash / SD Card" },
    { key: "Capacity", placeholder: "e.g., 1TB" },
    { key: "Interface", placeholder: "e.g., NVMe M.2 / SATA III / USB 3.2" },
    { key: "Read Speed", placeholder: "e.g., 7,000 MB/s" },
    { key: "Write Speed", placeholder: "e.g., 5,000 MB/s" },
    { key: "Form Factor", placeholder: "e.g., 2.5\" / M.2 2280" },
  ],
};

const STEPS = [
  { id: 0, label: "Basic Info", icon: Package },
  { id: 1, label: "Specifications", icon: Settings2 },
  { id: 2, label: "Pricing & Variants", icon: Tag },
  { id: 3, label: "Media", icon: Camera },
];

// ── Wizard Component ──────────────────────────────────────────────────
const ProductWizard = ({ editingProduct, onClose }: ProductWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: editingProduct?.name || "",
    description: editingProduct?.description || "",
    price: editingProduct ? String(editingProduct.price) : "",
    original_price: editingProduct?.original_price ? String(editingProduct.original_price) : "",
    category_id: editingProduct?.category_id || "",
    brand_id: editingProduct?.brand_id || "",
    image_url: editingProduct?.image_url || "",
    images: editingProduct?.images || [],
    sku: editingProduct?.sku || "",
    stock_quantity: String(editingProduct?.stock_quantity ?? 0),
    is_active: editingProduct?.is_active ?? true,
    is_featured: editingProduct?.is_featured ?? false,
    is_new: editingProduct?.is_new ?? false,
    is_on_sale: editingProduct?.is_on_sale ?? false,
    color: editingProduct?.color || "",
    model: editingProduct?.model || "",
  });

  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [specsLoaded, setSpecsLoaded] = useState(false);

  // Fetch categories & brands
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  // Load existing specs/variants if editing
  useQuery({
    queryKey: ["product-specs", editingProduct?.id],
    queryFn: async () => {
      if (!editingProduct?.id) return [];
      const { data, error } = await supabase
        .from("product_specifications")
        .select("*")
        .eq("product_id", editingProduct.id)
        .order("display_order");
      if (error) throw error;
      setSpecifications(data.map((s: any) => ({ id: s.id, spec_key: s.spec_key, spec_value: s.spec_value })));
      setSpecsLoaded(true);
      return data;
    },
    enabled: !!editingProduct?.id && !specsLoaded,
  });

  useQuery({
    queryKey: ["product-variants", editingProduct?.id],
    queryFn: async () => {
      if (!editingProduct?.id) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", editingProduct.id);
      if (error) throw error;
      setVariants(data.map((v: any) => ({
        id: v.id,
        variant_name: v.variant_name,
        sku: v.sku || "",
        price: String(v.price),
        stock_quantity: String(v.stock_quantity),
        attributes: v.attributes || {},
      })));
      return data;
    },
    enabled: !!editingProduct?.id,
  });

  // Get selected category slug for dynamic specs
  const selectedCategory = categories?.find((c) => c.id === formData.category_id);
  const categorySlug = selectedCategory?.slug?.toLowerCase() || "";
  const suggestedSpecs = CATEGORY_SPECS[categorySlug] || CATEGORY_SPECS["accessories"] || [];

  // ── Mutations ──────────────────────────────────────────────────────
  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
      const { data: product, error } = await supabase
        .from("products")
        .insert({ ...data, slug })
        .select()
        .single();
      if (error) throw error;
      return product;
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: product, error } = await supabase
        .from("products")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return product;
    },
  });

  // ── Image upload ───────────────────────────────────────────────────
  const uploadFile = async (file: File): Promise<string | null> => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Use JPG, PNG, WebP, GIF, or AVIF", variant: "destructive" });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
      return null;
    }
    const watermarkedFile = await addWatermark(file);
    const name = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const { error } = await supabase.storage.from("product-images").upload(`products/${name}`, watermarkedFile);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(`products/${name}`);
    return publicUrl;
  };

  const handleMainImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(files[0]);
      if (url) setFormData((p) => ({ ...p, image_url: url }));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files) return;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }
      setFormData((p) => ({ ...p, images: [...p.images, ...urls].slice(0, 5) }));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent, target: "main" | "gallery") => {
    e.preventDefault();
    setIsDragging(false);
    if (target === "main") handleMainImageUpload(e.dataTransfer.files);
    else handleGalleryUpload(e.dataTransfer.files);
  }, []);

  // ── Auto discount badge ────────────────────────────────────────────
  const discountPercent =
    formData.original_price && formData.price && parseFloat(formData.original_price) > parseFloat(formData.price)
      ? Math.round(((parseFloat(formData.original_price) - parseFloat(formData.price)) / parseFloat(formData.original_price)) * 100)
      : 0;

  // ── Spec helpers ───────────────────────────────────────────────────
  const loadCategorySpecs = () => {
    const existing = new Set(specifications.map((s) => s.spec_key));
    const newSpecs = suggestedSpecs
      .filter((s) => !existing.has(s.key))
      .map((s) => ({ spec_key: s.key, spec_value: "" }));
    setSpecifications((prev) => [...prev, ...newSpecs]);
  };

  // ── Variant helpers ────────────────────────────────────────────────
  const addVariant = () => {
    setVariants((prev) => [...prev, { variant_name: "", sku: "", price: formData.price, stock_quantity: "0", attributes: {} }]);
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: "Missing required fields", description: "Name and Price are required", variant: "destructive" });
      setCurrentStep(0);
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        image_url: formData.image_url || null,
        images: formData.images.length > 0 ? formData.images : null,
        sku: formData.sku || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_on_sale: discountPercent > 0 ? true : formData.is_on_sale,
        color: formData.color || null,
        model: formData.model || null,
      };

      let productId: string;

      if (editingProduct) {
        const res = await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        productId = res.id;
      } else {
        const res = await createProduct.mutateAsync(productData);
        productId = res.id;
      }

      // Save specifications
      if (editingProduct) {
        await supabase.from("product_specifications").delete().eq("product_id", productId);
      }
      const validSpecs = specifications.filter((s) => s.spec_key && s.spec_value);
      if (validSpecs.length > 0) {
        await supabase.from("product_specifications").insert(
          validSpecs.map((s, i) => ({ product_id: productId, spec_key: s.spec_key, spec_value: s.spec_value, display_order: i }))
        );
      }

      // Save variants
      if (editingProduct) {
        await supabase.from("product_variants").delete().eq("product_id", productId);
      }
      const validVariants = variants.filter((v) => v.variant_name && v.price);
      if (validVariants.length > 0) {
        await supabase.from("product_variants").insert(
          validVariants.map((v) => ({
            product_id: productId,
            variant_name: v.variant_name,
            sku: v.sku || null,
            price: parseFloat(v.price),
            stock_quantity: parseInt(v.stock_quantity) || 0,
            attributes: v.attributes,
          }))
        );
      }

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: editingProduct ? "Product updated!" : "Product created!" });
      onClose();
    } catch (e: any) {
      toast({ title: "Error saving product", description: e.message, variant: "destructive" });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  // ── Step validation ────────────────────────────────────────────────
  const canProceed = () => {
    if (currentStep === 0) return !!formData.name;
    return true;
  };

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {currentStep === 3 && (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProduct ? "Update Product" : "Publish Product"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = i < currentStep;
              const isActive = i === currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => i <= currentStep && setCurrentStep(i)}
                  className="flex items-center gap-2 group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-sm hidden sm:block ${
                      isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-1 ${isCompleted ? "bg-primary" : "bg-border"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Step 0: Basic Info ───────────────────────────────────── */}
        {currentStep === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">Product Information</h2>
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Samsung Galaxy S24 Ultra"
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Write a detailed product description..."
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g., SM-S928B"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g., SAM-S24U-256-BLK"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-foreground">Organization</h2>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select value={formData.brand_id} onValueChange={(v) => setFormData({ ...formData, brand_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g., Titanium Black"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h2 className="font-semibold text-foreground">Status</h2>
                  {[
                    { key: "is_active", label: "Active" },
                    { key: "is_featured", label: "Featured" },
                    { key: "is_new", label: "New Arrival" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="cursor-pointer">{label}</Label>
                      <Switch
                        checked={(formData as any)[key]}
                        onCheckedChange={(v) => setFormData({ ...formData, [key]: v })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Step 1: Specifications ──────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground text-lg">Product Specifications</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedCategory
                        ? `Showing specs for "${selectedCategory.name}"`
                        : "Select a category in Step 1 for suggested specs"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedCategory && (
                      <Button variant="outline" size="sm" onClick={loadCategorySpecs}>
                        <Settings2 className="h-4 w-4 mr-1" />
                        Load {selectedCategory.name} Specs
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSpecifications((p) => [...p, { spec_key: "", spec_value: "" }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Custom
                    </Button>
                  </div>
                </div>

                {specifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No specifications added yet.</p>
                    <p className="text-sm">Click "Load Specs" or "Add Custom" to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {specifications.map((spec, idx) => {
                      const suggestion = suggestedSpecs.find((s) => s.key === spec.spec_key);
                      return (
                        <div key={idx} className="flex items-start gap-3 group">
                          <GripVertical className="h-5 w-5 mt-2.5 text-muted-foreground/40" />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              value={spec.spec_key}
                              onChange={(e) => {
                                const updated = [...specifications];
                                updated[idx].spec_key = e.target.value;
                                setSpecifications(updated);
                              }}
                              placeholder="Attribute name"
                            />
                            <Input
                              value={spec.spec_value}
                              onChange={(e) => {
                                const updated = [...specifications];
                                updated[idx].spec_value = e.target.value;
                                setSpecifications(updated);
                              }}
                              placeholder={suggestion?.placeholder || "Value"}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setSpecifications((p) => p.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 2: Pricing & Variants ──────────────────────────── */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Pricing */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">Pricing</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Regular Price (UGX) *</Label>
                      <Input
                        type="number"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        placeholder="e.g., 3,500,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Price (UGX) *</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g., 2,800,000"
                          className={discountPercent > 0 ? "pr-20" : ""}
                        />
                        {discountPercent > 0 && (
                          <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground">
                            -{discountPercent}%
                          </Badge>
                        )}
                      </div>
                      {discountPercent > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Customer saves UGX {(parseFloat(formData.original_price) - parseFloat(formData.price)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Variants */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground text-lg">Product Variants</h2>
                      <p className="text-sm text-muted-foreground">Add variations like Color, Storage, Size</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addVariant}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variant
                    </Button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p>No variants. Product will be sold as a single option.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {variants.map((variant, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Variant {idx + 1}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-7 w-7"
                              onClick={() => setVariants((p) => p.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Name *</Label>
                              <Input
                                value={variant.variant_name}
                                onChange={(e) => {
                                  const u = [...variants]; u[idx].variant_name = e.target.value; setVariants(u);
                                }}
                                placeholder="e.g., 256GB Black"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">SKU</Label>
                              <Input
                                value={variant.sku}
                                onChange={(e) => {
                                  const u = [...variants]; u[idx].sku = e.target.value; setVariants(u);
                                }}
                                placeholder="Variant SKU"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price (UGX) *</Label>
                              <Input
                                type="number"
                                value={variant.price}
                                onChange={(e) => {
                                  const u = [...variants]; u[idx].price = e.target.value; setVariants(u);
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Stock</Label>
                              <Input
                                type="number"
                                value={variant.stock_quantity}
                                onChange={(e) => {
                                  const u = [...variants]; u[idx].stock_quantity = e.target.value; setVariants(u);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Price Preview Sidebar */}
            <div>
              <Card className="sticky top-32">
                <CardContent className="pt-6 space-y-3">
                  <h2 className="font-semibold text-foreground">Price Preview</h2>
                  {formData.original_price && parseFloat(formData.original_price) > 0 && (
                    <p className="text-muted-foreground line-through text-sm">
                      UGX {parseFloat(formData.original_price).toLocaleString()}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-foreground">
                    UGX {formData.price ? parseFloat(formData.price).toLocaleString() : "0"}
                  </p>
                  {discountPercent > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      {discountPercent}% OFF
                    </Badge>
                  )}
                  <div className="pt-3 border-t border-border space-y-1 text-sm text-muted-foreground">
                    <p>Stock: {formData.stock_quantity || 0} units</p>
                    <p>Variants: {variants.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Step 3: Media ───────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Image */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">Main Display Image</h2>
                  <p className="text-sm text-muted-foreground">
                    This is the primary image shown in listings. Use high resolution (min 800x800px).
                  </p>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "main")}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => mainInputRef.current?.click()}
                  >
                    {formData.image_url ? (
                      <div className="relative inline-block">
                        <img src={formData.image_url} alt="Main" className="max-h-64 rounded-lg mx-auto object-contain" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, image_url: "" }); }}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
                          Main Image
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <div>
                          <p className="text-foreground font-medium">Drop image here or click to upload</p>
                          <p className="text-sm text-muted-foreground">JPG, PNG, WebP up to 5MB • Min 800x800px</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={mainInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleMainImageUpload(e.target.files)} />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Or paste image URL</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Gallery Images */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground text-lg">Gallery Images</h2>
                      <p className="text-sm text-muted-foreground">Up to 5 additional images ({formData.images.length}/5)</p>
                    </div>
                    {formData.images.length < 5 && (
                      <Button variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Images
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 5 && (
                      <div
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => galleryInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "gallery")}
                      >
                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground mt-1">Add</span>
                      </div>
                    )}
                  </div>
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
                </CardContent>
              </Card>
            </div>

            {/* Preview sidebar */}
            <div>
              <Card className="sticky top-32">
                <CardContent className="pt-6 space-y-3">
                  <h2 className="font-semibold text-foreground">Product Preview</h2>
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full rounded-lg aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <h3 className="font-medium text-foreground text-sm">{formData.name || "Product Name"}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                      UGX {formData.price ? parseFloat(formData.price).toLocaleString() : "0"}
                    </span>
                    {discountPercent > 0 && (
                      <Badge variant="destructive" className="text-xs">-{discountPercent}%</Badge>
                    )}
                  </div>
                  {formData.original_price && discountPercent > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      UGX {parseFloat(formData.original_price).toLocaleString()}
                    </span>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onClose()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Previous"}
          </Button>
          {currentStep < 3 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending || !formData.name || !formData.price}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProduct ? "Update Product" : "Publish Product"}
            </Button>
          )}
        </div>

        {isUploading && (
          <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-xl p-6 flex items-center gap-3 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-foreground">Uploading image...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductWizard;
