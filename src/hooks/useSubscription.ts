import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  plan: "free" | "pro";
  is_active: boolean;
  expires_at: string | null;
  started_at: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  productCount: number;
  canAddProduct: boolean;
  refetch: () => Promise<void>;
}

export const FREE_PRODUCT_LIMIT = 10;
export const FREE_IMAGE_LIMIT = 3;
export const PRO_IMAGE_LIMIT = 6;

export const useSubscription = (storeId: string | null): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!storeId) return;

    const [subRes, prodRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, is_active, expires_at, started_at")
        .eq("store_id", storeId)
        .maybeSingle(),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId),
    ]);

    setSubscription(subRes.data as Subscription | null);
    setProductCount(prodRes.count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const isPro = subscription?.plan === "pro" && subscription?.is_active === true;
  const canAddProduct = isPro || productCount < FREE_PRODUCT_LIMIT;

  return {
    subscription,
    isPro,
    loading,
    productCount,
    canAddProduct,
    refetch: fetchData,
  };
};

