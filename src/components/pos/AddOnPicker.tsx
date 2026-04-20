import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Search, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export interface AddOn {
  name: string;
  price: number;
  product_id?: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

interface AddOnPickerProps {
  products: ProductOption[];
  onAdd: (addon: AddOn) => void;
}

const AddOnPicker = ({ products, onAdd }: AddOnPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const handlePickProduct = (p: ProductOption) => {
    onAdd({ name: p.name, price: p.price, product_id: p.id });
    setOpen(false);
    setSearch("");
  };

  const handleAddCustom = () => {
    const price = parseFloat(customPrice) || 0;
    if (!customName.trim()) return;
    onAdd({ name: customName.trim(), price });
    setCustomName("");
    setCustomPrice("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-dashed">
          <Sparkles className="h-3 w-3" />
          Add-on / Upgrade
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Tabs defaultValue="catalog">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="catalog" className="text-xs">From catalog</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-2 mt-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accessories..."
                className="pl-7 h-8 text-xs"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {search ? "No matches" : "Type to search"}
                </p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePickProduct(p)}
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent text-left"
                  >
                    <span className="text-xs truncate flex-1">{p.name}</span>
                    <span className="text-xs font-mono text-primary whitespace-nowrap">
                      +{formatCurrency(p.price)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-2 mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Add-on name</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Screen guard fitted"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Extra charge (UGX)</Label>
              <Input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="0 = free"
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleAddCustom}
              disabled={!customName.trim()}
            >
              <Plus className="h-3 w-3 mr-1" /> Attach add-on
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default AddOnPicker;
