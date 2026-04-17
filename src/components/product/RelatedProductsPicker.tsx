import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Link2 } from "lucide-react";

interface Props {
  storeId: string;
  currentProductId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const RelatedProductsPicker = ({ storeId, currentProductId, selectedIds, onChange }: Props) => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!storeId) return;
    supabase
      .from("products")
      .select("id, name, price, product_images(*)")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setProducts((data || []).filter((p) => p.id !== currentProductId));
      });
  }, [storeId, currentProductId]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div>
        <Label className="flex items-center gap-1.5">
          <Link2 className="h-4 w-4" /> Frequently Bought Together
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select products that complement this one. They'll appear in a section on the product page.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">No other active products yet.</p>
        </div>
      ) : (
        <>
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/60">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">No products found</p>
            ) : (
              filtered.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const image = product.product_images?.[0]?.image_url;
                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => toggle(product.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                      isSelected ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-accent"
                    }`}
                    data-testid={`related-product-${product.id}`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/60">
                      {image ? (
                        <img src={image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(product.price))}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {selectedIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""} selected as related
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default RelatedProductsPicker;
