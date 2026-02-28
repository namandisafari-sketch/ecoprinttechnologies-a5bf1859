import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, Bell, Shield, Store, Database, Download, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ALL_TABLES = [
  "products",
  "categories",
  "brands",
  "product_specifications",
  "product_variants",
  "orders",
  "order_items",
  "devices",
  "notifications",
  "notification_reads",
  "hero_slides",
  "newsletter_subscribers",
  "user_roles",
  "seller_profiles",
  "seller_services",
  "service_requests",
  "store_settings",
  "messages",
  "conversations",
  "delivery_zones",
];

const IMAGE_URL_FIELDS = [
  "image_url",
  "images",
  "logo_url",
  "avatar_url",
  "thumbnail_url",
  "photo_url",
];

async function fetchAllRows(table: string) {
  const allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      console.warn(`Skipping table ${table}:`, error.message);
      return null;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRows;
}

function extractImageUrls(rows: any[]): string[] {
  const urls: string[] = [];
  for (const row of rows) {
    for (const field of IMAGE_URL_FIELDS) {
      const val = row[field];
      if (!val) continue;
      if (typeof val === "string" && val.startsWith("http")) {
        urls.push(val);
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === "string" && item.startsWith("http")) {
            urls.push(item);
          }
        }
      }
    }
  }
  return [...new Set(urls)];
}

async function downloadImage(url: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const urlObj = new URL(url);
    const name = urlObj.pathname.split("/").filter(Boolean).join("_");
    return { blob, name };
  } catch {
    return null;
  }
}

const AdminSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  // Load maintenance mode state
  useState(() => {
    supabase
      .from("store_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle()
      .then(({ data }) => {
        setMaintenanceMode(data?.value === true);
        setLoadingMaintenance(false);
      });
  });

  const toggleMaintenanceMode = async (enabled: boolean) => {
    setMaintenanceMode(enabled);
    const { data: existing } = await supabase
      .from("store_settings")
      .select("id")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    if (existing) {
      await supabase.from("store_settings").update({ value: enabled, updated_at: new Date().toISOString() }).eq("key", "maintenance_mode");
    } else {
      await supabase.from("store_settings").insert({ key: "maintenance_mode", value: enabled });
    }
    toast.success(enabled ? "Maintenance mode enabled" : "Maintenance mode disabled");
  };

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const exportData: Record<string, any[]> = {};
      const allImageUrls: string[] = [];

      for (const table of ALL_TABLES) {
        const rows = await fetchAllRows(table);
        if (rows !== null) {
          exportData[table] = rows;
          allImageUrls.push(...extractImageUrls(rows));
        }
      }

      // Save JSON data
      zip.file("data.json", JSON.stringify(exportData, null, 2));

      // Save manifest
      zip.file("manifest.json", JSON.stringify({
        exported_at: new Date().toISOString(),
        tables: Object.keys(exportData),
        row_counts: Object.fromEntries(
          Object.entries(exportData).map(([k, v]) => [k, v.length])
        ),
        image_count: allImageUrls.length,
      }, null, 2));

      // Download and save images
      if (allImageUrls.length > 0) {
        const imagesFolder = zip.folder("images");
        let downloaded = 0;
        for (const url of allImageUrls) {
          const result = await downloadImage(url);
          if (result && imagesFolder) {
            imagesFolder.file(result.name, result.blob);
            downloaded++;
          }
        }
        toast.info(`Downloaded ${downloaded}/${allImageUrls.length} images`);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().slice(0, 10);
      saveAs(blob, `store-export-${dateStr}.zip`);
      toast.success("Export completed successfully!");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const dataFile = zip.file("data.json");
      if (!dataFile) {
        toast.error("Invalid export file: missing data.json");
        return;
      }

      const dataStr = await dataFile.async("string");
      const importData: Record<string, any[]> = JSON.parse(dataStr);

      // Order tables for import (dependencies first)
      const importOrder = [
        "categories",
        "brands",
        "store_settings",
        "devices",
        "products",
        "product_specifications",
        "product_variants",
        "hero_slides",
        "notifications",
        "notification_reads",
        "newsletter_subscribers",
        "user_roles",
        "seller_profiles",
        "seller_services",
        "service_requests",
        "conversations",
        "messages",
        "orders",
        "order_items",
        "delivery_zones",
      ];

      let totalImported = 0;
      let totalFailed = 0;

      for (const table of importOrder) {
        const rows = importData[table];
        if (!rows || rows.length === 0) continue;

        // Upsert in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error } = await (supabase as any)
            .from(table)
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

          if (error) {
            console.warn(`Import error for ${table}:`, error.message);
            totalFailed += batch.length;
          } else {
            totalImported += batch.length;
          }
        }
      }

      toast.success(`Import complete: ${totalImported} rows imported, ${totalFailed} failed`);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your admin preferences</p>
      </div>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Settings
          </CardTitle>
          <CardDescription>Configure your store preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable the storefront for customers
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={toggleMaintenanceMode}
              disabled={loadingMaintenance}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Guest Checkout</Label>
              <p className="text-sm text-muted-foreground">
                Let customers checkout without an account
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure admin notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Orders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a new order is placed
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when products are running low
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Chat Messages</Label>
              <p className="text-sm text-muted-foreground">
                Notify on new customer messages
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Security and access settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Admin Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export or import your store data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all store data &amp; images as a ZIP file
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="h-4 w-4 mr-1" /> Export</>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Import Data</Label>
              <p className="text-sm text-muted-foreground">
                Restore data from a previously exported ZIP file
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-1" /> Import</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
