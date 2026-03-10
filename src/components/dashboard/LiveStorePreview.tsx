import { Store, ShoppingCart, MessageCircle, Share2, Check } from "lucide-react";

interface LiveStorePreviewProps {
  store: any;
  productName: string;
  productPrice: string;
  productDescription: string;
  productImages: string[];
  existingProducts: any[];
}

const LiveStorePreview = ({
  store,
  productName,
  productPrice,
  productDescription,
  productImages,
  existingProducts,
}: LiveStorePreviewProps) => {
  const brandColor = store?.brand_color || "#6366F1";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

  const newProduct = productName || productImages.length > 0 ? {
    name: productName || "Product Name",
    price: productPrice ? parseFloat(productPrice) : 0,
    description: productDescription,
    image: productImages[0] || null,
  } : null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden h-full flex flex-col">
      {/* Mini header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          {store?.logo_url ? (
            <img src={store.logo_url} alt="" className="h-6 w-6 rounded-md object-cover" />
          ) : (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ background: brandColor }}
            >
              {(store?.name || "S").charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground">{store?.name || "Your Store"}</span>
        </div>
        <div className="rounded-lg bg-accent p-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-foreground" />
        </div>
      </div>

      {/* Preview label */}
      <div className="bg-accent/50 px-4 py-1.5 text-center">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Live Preview
        </span>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2.5">
          {/* New product being created (highlighted) */}
          {newProduct && (
            <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 overflow-hidden animate-in fade-in duration-300">
              <div className="aspect-square bg-muted relative">
                {newProduct.image ? (
                  <img src={newProduct.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Store className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-1 left-1 rounded-full bg-primary px-1.5 py-0.5">
                  <span className="text-[8px] font-bold text-primary-foreground">NEW</span>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-foreground truncate">
                  {newProduct.name}
                </p>
                <p className="text-[11px] font-bold mt-0.5" style={{ color: brandColor }}>
                  {newProduct.price > 0 ? formatCurrency(newProduct.price) : "₦0.00"}
                </p>
                <button
                  className="mt-1.5 w-full rounded-md py-1 text-[9px] font-medium text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}

          {/* Existing products */}
          {existingProducts.slice(0, 5).map((product) => {
            const img = product.product_images?.[0]?.image_url;
            return (
              <div key={product.id} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="aspect-square bg-muted">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: brandColor }}>
                    {formatCurrency(Number(product.price))}
                  </p>
                  <button
                    className="mt-1.5 w-full rounded-md py-1 text-[9px] font-medium text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 py-2 text-center">
        <span className="text-[9px] text-muted-foreground">
          Powered by <span className="font-semibold text-primary">Storvo</span>
        </span>
      </div>
    </div>
  );
};

export default LiveStorePreview;
