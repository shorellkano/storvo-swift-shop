import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ProductCard from "@/components/dashboard/ProductCard";

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async (storeId: string) => {
    const { data: prods } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    setProducts(prods || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!storeData) { navigate("/setup"); return; }
      setStore(storeData);
      fetchProducts(storeData.id);
    };

    init();
  }, [user, navigate]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!store || loading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-display text-lg font-semibold text-foreground">Products</h2>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-background">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Your Products</h1>
                <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""}</p>
              </div>
              <Button variant="hero" onClick={() => navigate("/dashboard/products/new")}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>

            {products.length > 3 && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-16 shadow-card">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-lg font-semibold text-foreground">No products yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add your first product to start selling</p>
                <Button variant="hero" className="mt-6" onClick={() => navigate("/dashboard/products/new")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={store.slug}
                    onDeleted={() => fetchProducts(store.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-full text-center py-12 text-muted-foreground">No products match your search</p>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Products;
