import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!storeData) { navigate("/setup"); return; }
      setStore(storeData);

      const { data: prods } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false });

      setProducts(prods || []);
      setLoading(false);
    };

    fetch();
  }, [user, navigate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

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
          <main className="flex-1 p-6 bg-background">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Your Products</h1>
              <Button variant="hero" onClick={() => navigate("/dashboard/products/new")}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>

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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const mainImage = product.product_images?.[0]?.image_url;
                  return (
                    <div key={product.id} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all">
                      <div className="aspect-square bg-muted">
                        {mainImage ? (
                          <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-foreground truncate">{product.name}</h3>
                        <p className="text-sm font-medium text-storvo-indigo">{formatCurrency(Number(product.price))}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                          }`}>
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                            {product.product_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Products;
