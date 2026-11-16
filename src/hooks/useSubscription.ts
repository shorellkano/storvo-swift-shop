import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  FREE_PRODUCT_LIMIT,
  PLAN_FEATURES,
  StorvoPlan,
} from "@/lib/planFeatures";

export {
  FREE_PRODUCT_LIMIT,
  PRO_PRODUCT_LIMIT,
  FREE_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
  FREE_VIDEO_LIMIT,
  PRO_VIDEO_LIMIT,
  FREE_GALLERY_LIMIT,
  PRO_GALLERY_LIMIT,
} from "@/lib/planFeatures";

type SubscriptionRecord = {
  id: string;
  store_id: string;
  plan: string;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export const useSubscription = (
  storeId?: string | null,
) => {
  const [
    subscription,
    setSubscription,
  ] = useState<SubscriptionRecord | null>(
    null,
  );

  const [productCount, setProductCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const loadSubscription = async () => {
    if (!storeId) {
      setSubscription(null);
      setProductCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [
        subscriptionResult,
        productResult,
      ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("store_id", storeId)
          .maybeSingle(),

        supabase
          .from("products")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("store_id", storeId),
      ]);

      if (subscriptionResult.error) {
        throw subscriptionResult.error;
      }

      if (productResult.error) {
        throw productResult.error;
      }

      setSubscription(
        subscriptionResult.data as SubscriptionRecord | null,
      );

      setProductCount(
        productResult.count || 0,
      );
    } catch (error) {
      console.error(
        "Could not load Storvo subscription:",
        error,
      );

      setSubscription(null);
      setProductCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscription();
  }, [storeId]);

  const plan: StorvoPlan =
    subscription?.plan === "pro" &&
    subscription?.is_active === true
      ? "pro"
      : "free";

  const isPro = plan === "pro";

  const productLimit =
    PLAN_FEATURES[plan].usage.products;

  const canAddProduct =
    productCount < productLimit;

  return {
    subscription,
    plan,
    isPro,
    loading,
    productCount,
    productLimit,
    canAddProduct,
    refetch: loadSubscription,
  };
};