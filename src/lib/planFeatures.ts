export type StorvoPlan = "free" | "pro";

export const FREE_PRODUCT_LIMIT = 10;
export const PRO_PRODUCT_LIMIT = 500;

export const FREE_IMAGE_LIMIT = 3;
export const PRO_IMAGE_LIMIT = 10;

export const FREE_VIDEO_LIMIT = 0;
export const PRO_VIDEO_LIMIT = 4;

export const FREE_GALLERY_LIMIT = 6;
export const PRO_GALLERY_LIMIT = 30;

export const FREE_AI_DESCRIPTIONS_PER_MONTH = 5;
export const PRO_AI_DESCRIPTIONS_PER_MONTH = 100;

export const FREE_AI_ASSISTANT_MESSAGES_PER_MONTH = 10;
export const PRO_AI_ASSISTANT_MESSAGES_PER_MONTH = 300;

export const PLAN_FEATURES = {
  free: {
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,

    usage: {
      products: FREE_PRODUCT_LIMIT,
      imagesPerProduct: FREE_IMAGE_LIMIT,
      videosPerProduct: FREE_VIDEO_LIMIT,
      galleryItems: FREE_GALLERY_LIMIT,
      aiDescriptionsPerMonth: FREE_AI_DESCRIPTIONS_PER_MONTH,
      aiAssistantMessagesPerMonth:
        FREE_AI_ASSISTANT_MESSAGES_PER_MONTH,
    },

    entitlements: {
      customDomain: false,
      professionalEmail: false,
      professionalEmailFreeMonths: 0,

      founderSection: false,
      testimonials: false,
      customerReviews: false,

      advancedAnalytics: false,
      advancedSeo: false,

      removeStorvoBranding: false,
      premiumTemplates: false,

      discountCodes: false,
      productVariants: true,

      videoPortfolio: false,
      aiAccountActions: false,
    },

    transactionFeePercent: 1,
  },

  pro: {
    name: "Pro",
    priceMonthly: 3500,
    priceAnnual: 35000,

    usage: {
      products: PRO_PRODUCT_LIMIT,
      imagesPerProduct: PRO_IMAGE_LIMIT,
      videosPerProduct: PRO_VIDEO_LIMIT,
      galleryItems: PRO_GALLERY_LIMIT,
      aiDescriptionsPerMonth: PRO_AI_DESCRIPTIONS_PER_MONTH,
      aiAssistantMessagesPerMonth:
        PRO_AI_ASSISTANT_MESSAGES_PER_MONTH,
    },

    entitlements: {
      customDomain: true,
      professionalEmail: true,
      professionalEmailFreeMonths: 12,

      founderSection: true,
      testimonials: true,
      customerReviews: true,

      advancedAnalytics: true,
      advancedSeo: true,

      removeStorvoBranding: true,
      premiumTemplates: true,

      discountCodes: true,
      productVariants: true,

      videoPortfolio: true,
      aiAccountActions: true,
    },

    transactionFeePercent: 0,
  },
} as const;

export const getPlanFeatures = (
  plan: StorvoPlan,
) => PLAN_FEATURES[plan];

export const getPlanUsageLimits = (
  plan: StorvoPlan,
) => PLAN_FEATURES[plan].usage;

export const getPlanEntitlements = (
  plan: StorvoPlan,
) => PLAN_FEATURES[plan].entitlements;

export const canUseFeature = <
  K extends keyof typeof PLAN_FEATURES.free.entitlements,
>(
  plan: StorvoPlan,
  feature: K,
) => PLAN_FEATURES[plan].entitlements[feature];

export const getUsageLimit = <
  K extends keyof typeof PLAN_FEATURES.free.usage,
>(
  plan: StorvoPlan,
  key: K,
) => PLAN_FEATURES[plan].usage[key];

export const hasReachedUsageLimit = <
  K extends keyof typeof PLAN_FEATURES.free.usage,
>(
  plan: StorvoPlan,
  key: K,
  currentUsage: number,
) =>
  currentUsage >=
  PLAN_FEATURES[plan].usage[key];

export const getRemainingUsage = <
  K extends keyof typeof PLAN_FEATURES.free.usage,
>(
  plan: StorvoPlan,
  key: K,
  currentUsage: number,
) =>
  Math.max(
    0,
    PLAN_FEATURES[plan].usage[key] -
      currentUsage,
  );

export const formatPlanPrice = (
  amount: number,
) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);