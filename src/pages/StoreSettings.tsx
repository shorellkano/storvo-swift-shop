import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Eye,
  Images,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Palette,
  Plus,
  Save,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useSubscription } from "@/hooks/useSubscription";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BillingSection from "@/components/dashboard/BillingSection";
import BankDetailsCard from "@/components/dashboard/BankDetailsCard";
import CustomDomainCard from "@/components/dashboard/CustomDomainCard";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import FounderProfileSettings from "@/components/dashboard/FounderProfileSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BRAND_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
];

const FREE_GALLERY_LIMIT = 6;
const PRO_GALLERY_LIMIT = 30;
const MAX_GALLERY_FILE_SIZE = 8 * 1024 * 1024;
const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FOUNDER_FILE_SIZE = 5 * 1024 * 1024;
const getFounderDraftKey = (storeId: string) =>
  `storvo-founder-draft-${storeId}`;
const FOUNDER_IMAGE_URL_TTL = 60 * 60 * 24 * 365 * 10;

type StorefrontType = "product" | "service";

type GalleryItem = {
  title: string;
  description: string;
  imageUrl: string;
  storagePath?: string;
  date: string;
  location: string;
};

type UpcomingEvent = {
  title: string;
  description: string;
  date: string;
  location: string;
};

type StorefrontSection = {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
};

type FounderProfile = {
  enabled: boolean;
  sectionLabel: string;
  name: string;
  role: string;
  imageUrl: string;
  storagePath?: string;
  biography: string;
  quote: string;
  profileUrl: string;
  buttonText: string;
};

type HomepageEditorState = {
  storefrontType: StorefrontType;
  heroHeadline: string;
  heroDescription: string;
  primaryCta: string;
  secondaryCta: string;
  aboutTitle: string;
  aboutText: string;
  sectionTitle: string;
  sectionSubtitle: string;
  serviceArea: string;
  enquiryButtonText: string;
  showAbout: boolean;
  showTrustStrip: boolean;
  showSearch: boolean;
  showCategories: boolean;
  showFeaturedSection: boolean;
  showGallery: boolean;
  showUpcomingEvents: boolean;
  galleryItems: GalleryItem[];
  upcomingEvents: UpcomingEvent[];
  founder: FounderProfile;
  facebook: string;
  tiktok: string;
  linkedin: string;
  x: string;
  youtube: string;
  snapchat: string;
  sections: StorefrontSection[];
};

const DEFAULT_HOMEPAGE: HomepageEditorState = {
  storefrontType: "product",
  heroHeadline: "",
  heroDescription: "",
  primaryCta: "Shop now",
  secondaryCta: "Browse products",
  aboutTitle: "About us",
  aboutText: "",
  sectionTitle: "Shop the collection",
  sectionSubtitle: "",
  serviceArea: "",
  enquiryButtonText: "Make an enquiry",
  showAbout: true,
  showTrustStrip: true,
  showSearch: true,
  showCategories: true,
  showFeaturedSection: true,
  showGallery: false,
  showUpcomingEvents: false,
  galleryItems: [],
  upcomingEvents: [],
  founder: {
    enabled: false,
    sectionLabel: "Meet the Founder",
    name: "",
    role: "",
    imageUrl: "",
    storagePath: "",
    biography: "",
    quote: "",
    profileUrl: "",
    buttonText: "Learn more",
  },
  facebook: "",
  tiktok: "",
  linkedin: "",
  x: "",
  youtube: "",
  snapchat: "",
  sections: [],
};

const getNestedValue = (
  source: any,
  paths: string[][],
  fallback = "",
) => {
  for (const path of paths) {
    let value = source;

    for (const key of path) {
      value = value?.[key];
    }

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  return fallback;
};

const cleanText = (value: string) =>
  value
    .replace(/â€¦|Â…/g, "…")
    .replace(/â€™|Â’/g, "'")
    .replace(/â€œ|â€|Â“|Â”/g, '"')
    .replace(/â€“|Â–/g, "–")
    .replace(/â€”|Â—/g, "—")
    .replace(/â‚¦|Â₦/g, "₦")
    .replace(/Ourâ\S*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const StoreSettings = () => {
  const { toast } = useToast();

  const logoInputRef =
    useRef<HTMLInputElement>(null);

  const galleryInputRef =
    useRef<HTMLInputElement>(null);

  const founderInputRef =
    useRef<HTMLInputElement>(null);

  const pendingGalleryIndexRef =
    useRef<number | null>(null);

  const storeContext = useStore() as any;

  const {
    store,
    role,
    loading,
    isOwner,
    setStore,
  } = storeContext;

  const {
    subscription,
    refetch: refetchSubscription,
  } = useSubscription(store?.id || null);

  const isPro =
    subscription?.plan === "pro" &&
    subscription?.is_active === true;

  const galleryLimit = isPro
    ? PRO_GALLERY_LIMIT
    : FREE_GALLERY_LIMIT;

  const [saving, setSaving] =
    useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [
    uploadingFounderImage,
    setUploadingFounderImage,
  ] = useState(false);

  const [
    uploadingGalleryIndex,
    setUploadingGalleryIndex,
  ] = useState<number | null>(null);

  const [showUpgrade, setShowUpgrade] =
    useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [brandColor, setBrandColor] =
    useState("#6366F1");

  const [
    whatsappNumber,
    setWhatsappNumber,
  ] = useState("");

  const [
    instagramHandle,
    setInstagramHandle,
  ] = useState("");

  const [facebook, setFacebook] =
    useState("");

  const [tiktok, setTiktok] =
    useState("");

  const [linkedin, setLinkedin] =
    useState("");

  const [xHandle, setXHandle] =
    useState("");

  const [youtube, setYoutube] =
    useState("");

  const [snapchat, setSnapchat] =
    useState("");

  const [deliveryFee, setDeliveryFee] =
    useState("");

  const [logoUrl, setLogoUrl] =
    useState<string | null>(null);

  const [homepage, setHomepage] =
    useState<HomepageEditorState>(
      DEFAULT_HOMEPAGE,
    );

  useEffect(() => {
    if (!store) {
      return;
    }

    const config =
      store.storefront_config &&
      typeof store.storefront_config ===
        "object"
        ? store.storefront_config
        : {};

    const fulfilmentType =
      config.fulfilmentType ||
      config.storefrontType ||
      config.storefront?.type;

    const inferredType: StorefrontType =
      fulfilmentType === "service" ||
      config.industryKey === "services" ||
      config.storefront?.mode === "service"
        ? "service"
        : "product";

    setName(store.name || "");

    setDescription(
      cleanText(store.description || ""),
    );

    setBrandColor(
      store.brand_color || "#6366F1",
    );

    setWhatsappNumber(
      store.whatsapp_number || "",
    );

    setInstagramHandle(
      store.instagram_handle ||
        config.identity?.instagramHandle ||
        "",
    );

    setFacebook(
      config.identity?.facebook || "",
    );

    setTiktok(
      config.identity?.tiktok || "",
    );

    setLinkedin(
      config.identity?.linkedin || "",
    );

    setXHandle(
      config.identity?.x || "",
    );

    setYoutube(
      config.identity?.youtube || "",
    );

    setSnapchat(
      config.identity?.snapchat || "",
    );

    setDeliveryFee(
      store.delivery_fee?.toString() || "0",
    );

    setLogoUrl(store.logo_url || null);

    setHomepage({
      storefrontType:
        config.storefrontType ||
        config.storefront?.type ||
        inferredType,

      heroHeadline: cleanText(
        getNestedValue(config, [
          ["homepage", "heroHeadline"],
          ["hero", "headline"],
          ["heroTitle"],
        ]),
      ),

      heroDescription: cleanText(
        getNestedValue(
          config,
          [
            ["homepage", "heroDescription"],
            ["hero", "description"],
            ["heroDescription"],
          ],
                    store.description || "",
        ),
      ),

      primaryCta: getNestedValue(
        config,
        [
          ["homepage", "primaryCta"],
          ["hero", "primaryCta"],
          ["primaryCta"],
        ],
        inferredType === "service"
          ? "View services"
          : "Shop now",
      ),

      secondaryCta: getNestedValue(
        config,
        [
          ["homepage", "secondaryCta"],
          ["hero", "secondaryCta"],
          ["secondaryCta"],
        ],
        inferredType === "service"
          ? "Make an enquiry"
          : "Browse products",
      ),

      aboutTitle: cleanText(
        getNestedValue(
          config,
          [["homepage", "aboutTitle"]],
          "About us",
        ),
      ),

      aboutText: cleanText(
        getNestedValue(
          config,
          [["homepage", "aboutText"]],
          store.description || "",
        ),
      ),

      sectionTitle: cleanText(
        getNestedValue(
          config,
          [
            ["homepage", "sectionTitle"],
            ["storefront", "sectionTitle"],
          ],
          inferredType === "service"
            ? "Our services"
            : "Shop the collection",
        ),
      ),

      sectionSubtitle: cleanText(
        getNestedValue(config, [
          ["homepage", "sectionSubtitle"],
        ]),
      ),

      serviceArea: cleanText(
        getNestedValue(config, [
          ["homepage", "serviceArea"],
        ]),
      ),

      enquiryButtonText: getNestedValue(
        config,
        [["homepage", "enquiryButtonText"]],
        "Make an enquiry",
      ),

      showAbout:
        config.homepage?.showAbout ?? true,

      showTrustStrip:
        config.homepage?.showTrustStrip ??
        config.storefront?.showTrustStrip ??
        true,

      showSearch:
        config.homepage?.showSearch ??
        config.storefront?.showSearch ??
        inferredType !== "service",

      showCategories:
        config.homepage?.showCategories ??
        config.storefront?.showCategories ??
        inferredType !== "service",

      showFeaturedSection:
        config.homepage?.showFeaturedSection ??
        config.storefront?.showFeaturedSection ??
        true,

      showGallery:
        config.homepage?.showGallery ?? false,

      showUpcomingEvents:
        config.homepage?.showUpcomingEvents ?? false,

      galleryItems: Array.isArray(
        config.homepage?.galleryItems,
      )
        ? config.homepage.galleryItems.map(
            (item: GalleryItem) => ({
              ...item,
              title: cleanText(
                item.title || "",
              ),
              description: cleanText(
                item.description || "",
              ),
              location: cleanText(
                item.location || "",
              ),
            }),
          )
        : [],

      upcomingEvents: Array.isArray(
        config.homepage?.upcomingEvents,
      )
        ? config.homepage.upcomingEvents.map(
            (item: UpcomingEvent) => ({
              ...item,
              title: cleanText(
                item.title || "",
              ),
              description: cleanText(
                item.description || "",
              ),
              location: cleanText(
                item.location || "",
              ),
            }),
          )
        : [],

      founder: {
        enabled:
          config.homepage?.founder?.enabled ??
          false,

        sectionLabel: cleanText(
          config.homepage?.founder
            ?.sectionLabel ||
            "Meet the Founder",
        ),

        name: cleanText(
          config.homepage?.founder?.name ||
            "",
        ),

        role: cleanText(
          config.homepage?.founder?.role ||
            "",
        ),

        imageUrl:
          config.homepage?.founder
            ?.imageUrl || "",

        storagePath:
          config.homepage?.founder
            ?.storagePath || "",

        biography: cleanText(
          config.homepage?.founder
            ?.biography || "",
        ),

        quote: cleanText(
          config.homepage?.founder?.quote ||
            "",
        ),

        profileUrl:
          config.homepage?.founder
            ?.profileUrl || "",

        buttonText: cleanText(
          config.homepage?.founder
            ?.buttonText || "Learn more",
        ),
      },

      facebook:
        config.identity?.facebook || "",

      tiktok:
        config.identity?.tiktok || "",

      linkedin:
        config.identity?.linkedin || "",

      x:
        config.identity?.x || "",

      youtube:
        config.identity?.youtube || "",

      snapchat:
        config.identity?.snapchat || "",

      sections: Array.isArray(
        config.homepage?.sections,
      )
        ? config.homepage.sections
        : [],
    });
  }, [store?.id]);

  useEffect(() => {
    if (!store?.id) {
      return;
    }

    try {
      const savedDraft =
        window.localStorage.getItem(
          getFounderDraftKey(store.id),
        );

      if (!savedDraft) {
        return;
      }

      const parsedDraft =
        JSON.parse(savedDraft);

      if (
        parsedDraft &&
        typeof parsedDraft === "object"
      ) {
        setHomepage((previous) => ({
          ...previous,
          founder: {
            ...previous.founder,
            ...parsedDraft,
          },
        }));
      }
    } catch (error) {
      console.error(
        "Founder draft restore failed:",
        error,
      );
    }
  }, [store?.id]);

  useEffect(() => {
    if (!store?.id) {
      return;
    }

    try {
      window.localStorage.setItem(
        getFounderDraftKey(store.id),
        JSON.stringify(
          homepage.founder,
        ),
      );
    } catch (error) {
      console.error(
        "Founder draft save failed:",
        error,
      );
    }
  }, [
    store?.id,
    homepage.founder,
  ]);

  useEffect(() => {
    const storagePath =
      homepage.founder.storagePath;

    if (!storagePath || !store?.id) {
      return;
    }

    let cancelled = false;

    const refreshFounderImageUrl =
      async () => {
        const {
          data,
          error,
        } = await supabase.storage
          .from("store-gallery")
          .createSignedUrl(
            storagePath,
            FOUNDER_IMAGE_URL_TTL,
          );

        if (
          error ||
          cancelled ||
          !data?.signedUrl
        ) {
          if (error) {
            console.error(
              "Founder image URL refresh failed:",
              error,
            );
          }

          return;
        }

        setHomepage((previous) => {
          if (
            previous.founder.storagePath !==
            storagePath
          ) {
            return previous;
          }

          return {
            ...previous,
            founder: {
              ...previous.founder,
              imageUrl:
                data.signedUrl,
            },
          };
        });
      };

    void refreshFounderImageUrl();

    return () => {
      cancelled = true;
    };
  }, [
    store?.id,
    homepage.founder.storagePath,
  ]);

  const updateHomepage = <
    K extends keyof HomepageEditorState,
  >(
    key: K,
    value: HomepageEditorState[K],
  ) => {
    setHomepage((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateFounder = <
    K extends keyof FounderProfile,
  >(
    key: K,
    value: FounderProfile[K],
  ) => {
    setHomepage((previous) => ({
      ...previous,
      founder: {
        ...previous.founder,
        [key]: value,
      },
    }));
  };

  const updateGalleryItem = (
    index: number,
    key: keyof GalleryItem,
    value: string,
  ) => {
    setHomepage((previous) => ({
      ...previous,
      galleryItems:
        previous.galleryItems.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [key]: value,
                }
              : item,
        ),
    }));
  };

  const addGalleryItem = () => {
    if (
      homepage.galleryItems.length >=
      galleryLimit
    ) {
      if (!isPro) {
        setShowUpgrade(true);
      }

      toast({
        title: "Gallery limit reached",
        description: isPro
          ? `Pro stores can currently add up to ${PRO_GALLERY_LIMIT} images.`
          : `Free stores can add ${FREE_GALLERY_LIMIT} images. Upgrade to Pro for up to ${PRO_GALLERY_LIMIT}.`,
      });

      return;
    }

    setHomepage((previous) => ({
      ...previous,
      showGallery: true,
      galleryItems: [
        ...previous.galleryItems,
        {
          title: "",
          description: "",
          imageUrl: "",
          storagePath: "",
          date: "",
          location: "",
        },
      ],
    }));
  };

  const removeStoredGalleryImage =
    async (storagePath?: string) => {
            if (!storagePath) {
        return;
      }

      const { error } =
        await supabase.storage
          .from("store-gallery")
          .remove([storagePath]);

      if (error) {
        console.error(
          "Gallery image deletion failed:",
          error,
        );
      }
    };

  const removeGalleryItem = async (
    index: number,
  ) => {
    const item =
      homepage.galleryItems[index];

    await removeStoredGalleryImage(
      item?.storagePath,
    );

    setHomepage((previous) => ({
      ...previous,
      galleryItems:
        previous.galleryItems.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    }));
  };

  const clearGalleryImage = async (
    index: number,
  ) => {
    const item =
      homepage.galleryItems[index];

    await removeStoredGalleryImage(
      item?.storagePath,
    );

    setHomepage((previous) => ({
      ...previous,
      galleryItems:
        previous.galleryItems.map(
          (galleryItem, itemIndex) =>
            itemIndex === index
              ? {
                  ...galleryItem,
                  imageUrl: "",
                  storagePath: "",
                }
              : galleryItem,
        ),
    }));
  };

  const chooseGalleryImage = (
    index: number,
  ) => {
    pendingGalleryIndexRef.current =
      index;

    galleryInputRef.current?.click();
  };

  const handleGalleryUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    const index =
      pendingGalleryIndexRef.current;

    event.target.value = "";

    if (
      !file ||
      index === null ||
      !store
    ) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      toast({
        title: "Invalid image",
        description:
          "Please upload a JPG, PNG or WebP image.",
        variant: "destructive",
      });

      return;
    }

    if (
      file.size >
      MAX_GALLERY_FILE_SIZE
    ) {
      toast({
        title: "Image too large",
        description:
          "Gallery images must be smaller than 8MB.",
        variant: "destructive",
      });

      return;
    }

    setUploadingGalleryIndex(index);

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your login session has expired.",
        );
      }

      const currentItem =
        homepage.galleryItems[index];

      if (currentItem?.storagePath) {
        await removeStoredGalleryImage(
          currentItem.storagePath,
        );
      }

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const storagePath =
        `${user.id}/${store.id}/` +
        `gallery-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("store-gallery")
          .upload(storagePath, file, {
            upsert: false,
            cacheControl: "3600",
            contentType:
              file.type ||
              "image/jpeg",
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("store-gallery")
        .getPublicUrl(storagePath);

      setHomepage((previous) => ({
        ...previous,
        showGallery: true,
        galleryItems:
          previous.galleryItems.map(
            (item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    imageUrl: publicUrl,
                    storagePath,
                  }
                : item,
          ),
      }));

      toast({
        title: "Gallery image uploaded",
        description:
          "Add its title and details, then save your settings.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description:
          error?.message ||
          "The gallery image could not be uploaded.",
        variant: "destructive",
      });
    } finally {
      pendingGalleryIndexRef.current =
        null;

      setUploadingGalleryIndex(null);
    }
  };

  const addUpcomingEvent = () => {
    setHomepage((previous) => ({
      ...previous,
      showUpcomingEvents: true,
      upcomingEvents: [
        ...previous.upcomingEvents,
        {
          title: "",
          description: "",
          date: "",
          location: "",
        },
      ],
    }));
  };

  const updateUpcomingEvent = (
    index: number,
    key: keyof UpcomingEvent,
    value: string,
  ) => {
    setHomepage((previous) => ({
      ...previous,
      upcomingEvents:
        previous.upcomingEvents.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [key]: value,
                }
              : item,
        ),
    }));
  };

  const removeUpcomingEvent = (
    index: number,
  ) => {
    setHomepage((previous) => ({
      ...previous,
      upcomingEvents:
        previous.upcomingEvents.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    }));
  };

  const changeStorefrontType = (
    value: StorefrontType,
  ) => {
    setHomepage((previous) => ({
      ...previous,
      storefrontType: value,

      primaryCta:
        value === "service" &&
        [
          "Shop now",
          "Shop products",
          "Shop the collection",
        ].includes(previous.primaryCta)
          ? "View services"
          : previous.primaryCta,

      secondaryCta:
        value === "service" &&
        [
          "Browse products",
          "Explore products",
        ].includes(
          previous.secondaryCta,
        )
          ? "Make an enquiry"
          : previous.secondaryCta,

      sectionTitle:
        value === "service" &&
        previous.sectionTitle ===
          "Shop the collection"
          ? "Our services"
          : value === "product" &&
              previous.sectionTitle ===
                "Our services"
            ? "Shop the collection"
            : previous.sectionTitle,

      showSearch:
        value === "service"
          ? false
          : previous.showSearch,

      showCategories:
        value === "service"
          ? false
          : previous.showCategories,
    }));
  };

  const handleFounderImageUpload =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      event.target.value = "";

      if (!file || !store) {
        return;
      }

      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(file.type)
      ) {
        toast({
          title: "Invalid image",
          description:
            "Please upload a JPG, PNG or WebP image.",
          variant: "destructive",
        });

        return;
      }

      if (
        file.size >
        MAX_FOUNDER_FILE_SIZE
      ) {
        toast({
          title: "Image too large",
          description:
            "Founder images must be smaller than 5MB.",
          variant: "destructive",
        });

        return;
      }

      setUploadingFounderImage(true);

      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            "Your login session has expired.",
          );
        }

        const previousStoragePath =
          homepage.founder.storagePath;

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const storagePath =
          `${user.id}/${store.id}/` +
          `founder-${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("store-gallery")
            .upload(
              storagePath,
              file,
              {
                upsert: false,
                cacheControl: "3600",
                contentType:
                  file.type ||
                  "image/jpeg",
              },
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: signedUrlData,
          error: signedUrlError,
        } = await supabase.storage
          .from("store-gallery")
          .createSignedUrl(
            storagePath,
            FOUNDER_IMAGE_URL_TTL,
          );

        if (
          signedUrlError ||
          !signedUrlData?.signedUrl
        ) {
          await supabase.storage
            .from("store-gallery")
                        .remove([storagePath]);

          throw (
            signedUrlError ||
            new Error(
              "The image uploaded, but its preview URL could not be created.",
            )
          );
        }

        setHomepage((previous) => ({
          ...previous,
          founder: {
            ...previous.founder,
            imageUrl:
              signedUrlData.signedUrl,
            storagePath,
          },
        }));

        if (previousStoragePath) {
          const { error: removeError } =
            await supabase.storage
              .from("store-gallery")
              .remove([
                previousStoragePath,
              ]);

          if (removeError) {
            console.error(
              "Previous founder image deletion failed:",
              removeError,
            );
          }
        }

        toast({
          title: "Profile image uploaded",
          description:
            "The preview is ready. Complete the profile details and save your settings.",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description:
            error?.message ||
            "The profile image could not be uploaded.",
          variant: "destructive",
        });
      } finally {
        setUploadingFounderImage(
          false,
        );
      }
    };

  const clearFounderImage =
    async () => {
      if (
        homepage.founder.storagePath
      ) {
        const { error } =
          await supabase.storage
            .from("store-gallery")
            .remove([
              homepage.founder
                .storagePath,
            ]);

        if (error) {
          console.error(
            "Founder image deletion failed:",
            error,
          );
        }
      }

      updateFounder("imageUrl", "");
      updateFounder("storagePath", "");
    };

  const handleLogoUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file || !store) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description:
          "Please upload an image file.",
        variant: "destructive",
      });

      return;
    }

    if (
      file.size > MAX_LOGO_FILE_SIZE
    ) {
      toast({
        title: "File too large",
        description:
          "Logo must be smaller than 2MB.",
        variant: "destructive",
      });

      return;
    }

    setUploadingLogo(true);

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your login session has expired.",
        );
      }

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "png";

      const filePath =
        `${user.id}/${store.id}/` +
        `logo-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("store-logos")
          .upload(filePath, file, {
            upsert: false,
            cacheControl: "3600",
            contentType:
              file.type || "image/png",
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("store-logos")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      toast({
        title: "Logo uploaded",
        description:
          "Save your settings to publish this logo.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description:
          error?.message ||
          "The logo could not be uploaded.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!store) {
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Store name required",
        description:
          "Please enter your store or business name.",
        variant: "destructive",
      });

      return;
    }

    const validGalleryItems =
      homepage.galleryItems
        .map((item) => ({
          title: cleanText(
            item.title,
          ),
          description: cleanText(
            item.description,
          ),
          imageUrl:
            item.imageUrl.trim(),
          storagePath:
            item.storagePath || "",
          date: item.date.trim(),
          location: cleanText(
            item.location,
          ),
        }))
        .filter(
          (item) =>
            item.title &&
            item.imageUrl,
        )
        .slice(0, galleryLimit);

    const validUpcomingEvents =
      homepage.upcomingEvents
        .map((item) => ({
          title: cleanText(
            item.title,
          ),
          description: cleanText(
            item.description,
          ),
          date: item.date.trim(),
          location: cleanText(
            item.location,
          ),
        }))
        .filter(
          (item) =>
            item.title &&
            item.date,
        );

    setSaving(true);

    try {
      const previousConfig =
        store.storefront_config &&
        typeof store.storefront_config ===
          "object"
          ? store.storefront_config
          : {};

      const cleanDescription =
        cleanText(description);

      const cleanHomepage = {
        ...homepage,

        heroHeadline: cleanText(
          homepage.heroHeadline,
        ),

        heroDescription: cleanText(
          homepage.heroDescription,
        ),

        primaryCta:
          homepage.primaryCta.trim(),

        secondaryCta:
          homepage.secondaryCta.trim(),

        aboutTitle: cleanText(
          homepage.aboutTitle,
        ),

        aboutText: cleanText(
          homepage.aboutText,
        ),

        sectionTitle: cleanText(
          homepage.sectionTitle,
        ),

        sectionSubtitle: cleanText(
          homepage.sectionSubtitle,
        ),

        serviceArea: cleanText(
          homepage.serviceArea,
        ),

        enquiryButtonText:
          homepage.enquiryButtonText.trim(),

        founder: {
          enabled:
            isPro &&
            homepage.founder.enabled,

          sectionLabel: cleanText(
            homepage.founder.sectionLabel,
          ),

          name: cleanText(
            homepage.founder.name,
          ),

          role: cleanText(
            homepage.founder.role,
          ),

          imageUrl:
            homepage.founder.imageUrl.trim(),

          storagePath:
            homepage.founder.storagePath || "",

          biography: cleanText(
            homepage.founder.biography,
          ),

          quote: cleanText(
            homepage.founder.quote,
          ),

          profileUrl:
            homepage.founder.profileUrl.trim(),

          buttonText:
            cleanText(
              homepage.founder.buttonText,
            ) || "Learn more",
        },

        facebook: facebook.trim(),
        tiktok: tiktok.trim(),
        linkedin: linkedin.trim(),
        x: xHandle.trim(),
        youtube: youtube.trim(),
        snapchat: snapchat.trim(),

        showSearch:
          homepage.storefrontType ===
          "service"
            ? false
            : homepage.showSearch,

        showCategories:
          homepage.storefrontType ===
          "service"
            ? false
            : homepage.showCategories,

        showGallery:
          homepage.showGallery &&
          validGalleryItems.length > 0,

        showUpcomingEvents:
          homepage.showUpcomingEvents &&
          validUpcomingEvents.length > 0,

        galleryItems:
          validGalleryItems,

        upcomingEvents:
          validUpcomingEvents,
      };

      const nextStorefrontConfig = {
        ...previousConfig,

        storefrontType:
          homepage.storefrontType,

        heroTitle:
          cleanHomepage.heroHeadline,

        heroDescription:
          cleanHomepage.heroDescription,

        primaryCta:
          cleanHomepage.primaryCta,

        secondaryCta:
          cleanHomepage.secondaryCta,

        hero: {
          ...(previousConfig.hero || {}),
          headline:
            cleanHomepage.heroHeadline,
          title:
            cleanHomepage.heroHeadline,
          description:
            cleanHomepage.heroDescription,
          subheadline:
            cleanHomepage.heroDescription,
          primaryCta:
            cleanHomepage.primaryCta,
          secondaryCta:
            cleanHomepage.secondaryCta,
        },

        homepage: {
          ...(previousConfig.homepage ||
            {}),
          ...cleanHomepage,
        },

        storefront: {
          ...(previousConfig.storefront ||
            {}),

          type:
            homepage.storefrontType,

          mode:
            homepage.storefrontType,

          sectionTitle:
                      cleanHomepage.sectionTitle,

          showTrustStrip:
            homepage.showTrustStrip,

          showSearch:
            cleanHomepage.showSearch,

          showCategories:
            cleanHomepage.showCategories,

          showFeaturedSection:
            homepage.showFeaturedSection,
        },

        identity: {
          ...(previousConfig.identity ||
            {}),

          storeName: name.trim(),

          description:
            cleanDescription,

          instagramHandle:
            instagramHandle
              .trim()
              .replace(/^@/, ""),

          facebook: facebook.trim(),
          tiktok: tiktok.trim(),
          linkedin: linkedin.trim(),
          x: xHandle.trim(),
          youtube: youtube.trim(),
          snapchat: snapchat.trim(),

          whatsappNumber:
            whatsappNumber.trim(),

          logoUrl,
        },

        branding: {
          ...(previousConfig.branding ||
            {}),
          primaryColor: brandColor,
        },

        brand: {
          ...(previousConfig.brand ||
            {}),
          primaryColor: brandColor,
        },
      };

      const {
        error,
      } = await supabase
        .from("stores")
        .update({
          name: name.trim(),

          description:
            cleanDescription || null,

          brand_color: brandColor,

          whatsapp_number:
            whatsappNumber.trim() ||
            null,

          instagram_handle:
            instagramHandle
              .trim()
              .replace(/^@/, "") ||
            null,

          delivery_fee:
            homepage.storefrontType ===
            "product"
              ? Number.parseFloat(
                  deliveryFee,
                ) || 0
              : 0,

          logo_url: logoUrl,

          storefront_config:
            nextStorefrontConfig,
        } as any)
        .eq("id", store.id);

      if (error) {
        throw error;
      }

      setHomepage(cleanHomepage);

      if (
        typeof setStore === "function"
      ) {
        setStore((previous: any) => ({
          ...previous,

          name: name.trim(),

          description:
            cleanDescription,

          brand_color: brandColor,

          whatsapp_number:
            whatsappNumber.trim(),

          instagram_handle:
            instagramHandle
              .trim()
              .replace(/^@/, ""),

          delivery_fee:
            homepage.storefrontType ===
            "product"
              ? Number.parseFloat(
                  deliveryFee,
                ) || 0
              : 0,

          logo_url: logoUrl,

          storefront_config:
            nextStorefrontConfig,
        }));
      }

      toast({
        title: "Settings saved",
        description:
          "Your storefront content has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving",
        description:
          error?.message ||
          "Your settings could not be saved.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openStorefront = () => {
    if (!store?.slug) {
      return;
    }

    window.open(
      `/store/${store.slug}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (!store || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleGalleryUpload}
      />

      <input
        ref={founderInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={
          handleFounderImageUpload
        }
      />

      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <DashboardSidebar
            store={store}
            role={role}
          />

          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card px-4">
              <div className="flex items-center">
                <SidebarTrigger className="mr-4" />

                <h2 className="font-display text-lg font-semibold text-foreground">
                  Store Settings
                </h2>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openStorefront}
              >
                <Eye className="mr-2 h-4 w-4" />
                View storefront
              </Button>
            </header>

            <main className="flex-1 bg-background p-4 sm:p-6">
              <div className="mx-auto max-w-4xl space-y-6">
                {isOwner && (
                  <BillingSection
                    subscription={
                      subscription
                    }
                    storeId={store.id}
                    onUpgrade={() =>
                      setShowUpgrade(true)
                    }
                    onCancelled={() =>
                      refetchSubscription()
                    }
                  />
                )}

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Camera className="h-5 w-5 text-primary" />
                      Store Logo
                    </CardTitle>

                    <CardDescription>
                      Upload your store logo.
                      Maximum file size: 2MB.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() =>
                          logoInputRef.current?.click()
                        }
                        className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition hover:border-primary"
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Store logo"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <Store className="h-9 w-9 text-muted-foreground" />
                          </span>
                        )}

                        {uploadingLogo && (
                          <span className="absolute inset-0 flex items-center justify-center bg-background/80">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </span>
                        )}
                      </button>

                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            logoInputRef.current?.click()
                          }
                          disabled={
                            uploadingLogo
                          }
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />

                          {uploadingLogo
                            ? "Uploading..."
                            : logoUrl
                              ? "Replace logo"
                              : "Upload logo"}
                        </Button>

                        <p className="mt-2 text-xs text-muted-foreground">
                          JPG, PNG or WebP.
                        </p>
                      </div>

                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={
                          handleLogoUpload
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Store className="h-5 w-5 text-primary" />
                      General
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">
                        Store or business name
                      </Label>

                      <Input
                        id="storeName"
                        value={name}
                        onChange={(event) =>
                          setName(
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeDesc">
                        Business description
                      </Label>

                      <Textarea
                        id="storeDesc"
                        value={description}
                        onChange={(event) =>
                          setDescription(
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="Tell customers about your business."
                      />
                    </div>

                    <div className="rounded-lg bg-accent/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        Store URL:{" "}
                        <span className="font-medium text-primary">
                          app.storvo.co/store/
                          {store.slug}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <LayoutTemplate className="h-5 w-5 text-primary" />
                      Storefront Type
                    </CardTitle>

                    <CardDescription>
                      Choose the experience
                      that matches what your
                      business sells.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeStorefrontType(
                            "product",
                          )
                        }
                        className={`rounded-xl border p-4 text-left ${
                          homepage.storefrontType ===
                          "product"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <ShoppingBag className="h-5 w-5 text-primary" />

                        <p className="mt-3 font-semibold">
                          Product storefront
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Products, search,
                          categories, cart and
                          checkout.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          changeStorefrontType(
                            "service",
                          )
                                                  }
                        className={`rounded-xl border p-4 text-left ${
                          homepage.storefrontType ===
                          "service"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <BriefcaseBusiness className="h-5 w-5 text-primary" />

                        <p className="mt-3 font-semibold">
                          Service storefront
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Services, galleries,
                          events, enquiries and
                          business information.
                        </p>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <LayoutTemplate className="h-5 w-5 text-primary" />
                      Homepage Content
                    </CardTitle>

                    <CardDescription>
                      Edit Storvo&apos;s generated
                      wording at any time.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="heroHeadline">
                        Main headline
                      </Label>

                      <Input
                        id="heroHeadline"
                        value={
                          homepage.heroHeadline
                        }
                        onChange={(event) =>
                          updateHomepage(
                            "heroHeadline",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heroDescription">
                        Homepage introduction
                      </Label>

                      <Textarea
                        id="heroDescription"
                        value={
                          homepage.heroDescription
                        }
                        onChange={(event) =>
                          updateHomepage(
                            "heroDescription",
                            event.target.value,
                          )
                        }
                        rows={3}
                        placeholder="Keep this short and focused."
                      />

                      <p className="text-xs text-muted-foreground">
                        Keep the homepage
                        introduction to roughly
                        25–35 words.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="primaryCta">
                          Main button text
                        </Label>

                        <Input
                          id="primaryCta"
                          value={
                            homepage.primaryCta
                          }
                          onChange={(event) =>
                            updateHomepage(
                              "primaryCta",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondaryCta">
                          Second button text
                        </Label>

                        <Input
                          id="secondaryCta"
                          value={
                            homepage.secondaryCta
                          }
                          onChange={(event) =>
                            updateHomepage(
                              "secondaryCta",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="sectionTitle">
                          Main section title
                        </Label>

                        <Input
                          id="sectionTitle"
                          value={
                            homepage.sectionTitle
                          }
                          onChange={(event) =>
                            updateHomepage(
                              "sectionTitle",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sectionSubtitle">
                          Section introduction
                        </Label>

                        <Input
                          id="sectionSubtitle"
                          value={
                            homepage.sectionSubtitle
                          }
                          onChange={(event) =>
                            updateHomepage(
                              "sectionSubtitle",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-5">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            About section
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Longer text will be
                            shortened on the
                            storefront with a Read
                            more button.
                          </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              homepage.showAbout
                            }
                            onChange={(event) =>
                              updateHomepage(
                                "showAbout",
                                event.target
                                  .checked,
                              )
                            }
                          />
                          Show
                        </label>
                      </div>

                      {homepage.showAbout && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="aboutTitle">
                              About heading
                            </Label>

                            <Input
                              id="aboutTitle"
                              value={
                                homepage.aboutTitle
                              }
                              onChange={(event) =>
                                updateHomepage(
                                  "aboutTitle",
                                  event.target
                                    .value,
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="aboutText">
                              About text
                            </Label>

                            <Textarea
                              id="aboutText"
                              value={
                                homepage.aboutText
                              }
                              onChange={(event) =>
                                updateHomepage(
                                  "aboutText",
                                  event.target
                                    .value,
                                )
                              }
                              rows={7}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {homepage.storefrontType ===
                      "service" && (
                      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="serviceArea">
                            Service area
                          </Label>

                          <Input
                            id="serviceArea"
                            value={
                              homepage.serviceArea
                            }
                            onChange={(event) =>
                              updateHomepage(
                                "serviceArea",
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Example: Lagos, Nigeria"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="enquiryButtonText">
                            Enquiry button
                          </Label>

                          <Input
                            id="enquiryButtonText"
                            value={
                              homepage.enquiryButtonText
                            }
                            onChange={(event) =>
                              updateHomepage(
                                "enquiryButtonText",
                                event.target
                                  .value,
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border pt-5">
                      <p className="font-semibold">
                        Homepage sections
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          {
                            key: "showTrustStrip" as const,
                            label:
                              "Trust information",
                          },
                          {
                            key: "showFeaturedSection" as const,
                            label:
                              homepage.storefrontType ===
                              "service"
                                ? "Services section"
                                : "Featured products",
                          },
                          {
                            key: "showSearch" as const,
                            label:
                              "Product search",
                            disabled:
                              homepage.storefrontType ===
                              "service",
                          },
                          {
                            key: "showCategories" as const,
                            label:
                              "Product categories",
                            disabled:
                              homepage.storefrontType ===
                              "service",
                          },
                        ].map((option) => (
                          <label
                            key={option.key}
                            className={`flex items-center gap-3 rounded-xl border border-border p-3 ${
                              option.disabled
                                ? "opacity-50"
                                : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                option.disabled
                                  ? false
                                  : homepage[
                                      option.key
                                    ]
                              }
                              disabled={
                                option.disabled
                              }
                              onChange={(event) =>
                                updateHomepage(
                                  option.key,
                                  event.target
                                    .checked,
                                )
                              }
                            />

                            <span className="text-sm font-medium">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {homepage.storefrontType ===
                  "service" && (
                  <FounderProfileSettings
                    isPro={isPro}
                    founder={homepage.founder}
                    uploadingFounderImage={
                      uploadingFounderImage
                    }
                    onUpdate={updateFounder}
                    onChooseImage={() =>
                      founderInputRef.current?.click()
                    }
                    onClearImage={() =>
                      void clearFounderImage()
                    }
                    onUpgrade={() =>
                      setShowUpgrade(true)
                    }
                  />
                )}

                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Images className="h-5 w-5 text-primary" />
                          Gallery
                        </CardTitle>

                        <CardDescription>
                          Add past events,
                          dishes, vehicles,
                          properties or completed
                          projects.
                        </CardDescription>
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={
                            homepage.showGallery
                          }
                          onChange={(event) =>
                            updateHomepage(
                              "showGallery",
                              event.target
                                .checked,
                            )
                          }
                        />
                        Show gallery
                      </label>
                    </div>
                  </CardHeader>
                                    <CardContent className="space-y-5">
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {
                            homepage.galleryItems
                              .length
                          }{" "}
                          of {galleryLimit} images
                          used
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {isPro
                            ? "Pro gallery capacity is active."
                            : `Free includes ${FREE_GALLERY_LIMIT} images. Pro includes up to ${PRO_GALLERY_LIMIT}.`}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addGalleryItem}
                      >
                        {!isPro &&
                        homepage.galleryItems
                          .length >=
                          FREE_GALLERY_LIMIT ? (
                          <LockKeyhole className="mr-2 h-4 w-4" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}

                        Add gallery item
                      </Button>
                    </div>

                    {homepage.galleryItems.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-border p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">
                              Gallery item{" "}
                              {index + 1}
                            </p>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                void removeGalleryItem(
                                  index,
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-4">
                            {item.imageUrl ? (
                              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
                                <img
                                  src={
                                    item.imageUrl
                                  }
                                  alt={
                                    item.title ||
                                    `Gallery item ${
                                      index + 1
                                    }`
                                  }
                                  className="aspect-[16/10] w-full object-cover"
                                />

                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-black/65 p-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      chooseGalleryImage(
                                        index,
                                      )
                                    }
                                    disabled={
                                      uploadingGalleryIndex ===
                                      index
                                    }
                                  >
                                    {uploadingGalleryIndex ===
                                    index ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <UploadCloud className="mr-2 h-4 w-4" />
                                    )}

                                    Replace
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    onClick={() =>
                                      void clearGalleryImage(
                                        index,
                                      )
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  chooseGalleryImage(
                                    index,
                                  )
                                }
                                disabled={
                                  uploadingGalleryIndex ===
                                  index
                                }
                                className="flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-primary disabled:opacity-60"
                              >
                                {uploadingGalleryIndex ===
                                index ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                ) : (
                                  <UploadCloud className="h-8 w-8 text-primary" />
                                )}

                                <span className="mt-3 font-semibold">
                                  Upload image
                                </span>

                                <span className="mt-1 text-xs text-muted-foreground">
                                  JPG, PNG or WebP.
                                  Maximum 8MB.
                                </span>
                              </button>
                            )}
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>
                                Title
                              </Label>

                              <Input
                                value={
                                  item.title
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateGalleryItem(
                                    index,
                                    "title",
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder="Luxury wedding at Eko Hotel"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                Date
                              </Label>

                              <Input
                                value={
                                  item.date
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateGalleryItem(
                                    index,
                                    "date",
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder="May 2026"
                              />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                              <Label>
                                Location
                              </Label>

                              <Input
                                value={
                                  item.location
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateGalleryItem(
                                    index,
                                    "location",
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder="Lagos, Nigeria"
                              />
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label>
                              Short description
                            </Label>

                            <Textarea
                              value={
                                item.description
                              }
                              onChange={(
                                event,
                              ) =>
                                updateGalleryItem(
                                  index,
                                  "description",
                                  event.target
                                    .value,
                                )
                              }
                              rows={2}
                              placeholder="A short description of this event or project."
                            />
                          </div>
                        </div>
                      ),
                    )}

                    {homepage.galleryItems
                      .length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                        <Images className="mx-auto h-8 w-8 text-muted-foreground" />

                        <p className="mt-3 font-semibold">
                          No gallery images yet
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Add your first event,
                          dish, vehicle, property
                          or project image.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {homepage.storefrontType ===
                  "service" && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Upcoming Events
                          </CardTitle>

                          <CardDescription>
                            Add launches,
                            workshops,
                            exhibitions, open days
                            or other public
                            events.
                          </CardDescription>
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              homepage.showUpcomingEvents
                            }
                            onChange={(event) =>
                              updateHomepage(
                                "showUpcomingEvents",
                                event.target
                                  .checked,
                              )
                            }
                          />
                          Show events
                        </label>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {homepage.upcomingEvents.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-border p-4"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">
                                Event {index + 1}
                              </p>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeUpcomingEvent(
                                    index,
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>
                                  Event title
                                </Label>

                                <Input
                                  value={
                                    item.title
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateUpcomingEvent(
                                      index,
                                      "title",
                                      event.target
                                        .value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>
                                  Date
                                </Label>

                                <Input
                                  type="date"
                                  value={
                                    item.date
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateUpcomingEvent(
                                      index,
                                      "date",
                                      event.target
                                        .value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2 sm:col-span-2">
                                <Label>
                                  Location
                                </Label>

                                <Input
                                  value={
                                    item.location
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateUpcomingEvent(
                                      index,
                                      "location",
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder="Venue or online"
                                />
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <Label>
                                Short description
                              </Label>

                              <Textarea
                                value={
                                  item.description
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateUpcomingEvent(
                                    index,
                                    "description",
                                    event.target
                                                                          .value,
                                  )
                                }
                                rows={2}
                              />
                            </div>
                          </div>
                        ),
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          addUpcomingEvent
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add upcoming event
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette className="h-5 w-5 text-primary" />
                      Brand Colour
                    </CardTitle>

                    <CardDescription>
                      This colour is used
                      throughout your
                      storefront.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {BRAND_COLORS.map(
                        (color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() =>
                              setBrandColor(
                                color,
                              )
                            }
                            className={`h-10 w-10 rounded-xl border-2 transition ${
                              brandColor ===
                              color
                                ? "scale-110 border-foreground shadow-md"
                                : "border-transparent"
                            }`}
                            style={{
                              backgroundColor:
                                color,
                            }}
                            aria-label={`Use ${color}`}
                          />
                        ),
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <Label htmlFor="customColor">
                        Custom:
                      </Label>

                      <input
                        type="color"
                        value={brandColor}
                        onChange={(event) =>
                          setBrandColor(
                            event.target.value,
                          )
                        }
                        className="h-9 w-9"
                      />

                      <Input
                        id="customColor"
                        value={brandColor}
                        onChange={(event) =>
                          setBrandColor(
                            event.target.value,
                          )
                        }
                        className="w-32 font-mono text-sm"
                        maxLength={7}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      Contact
                    </CardTitle>

                    <CardDescription>
                      Let customers reach you.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">
                        WhatsApp number
                      </Label>

                      <Input
                        id="whatsapp"
                        value={whatsappNumber}
                        onChange={(event) =>
                          setWhatsappNumber(
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">
                        Instagram handle or URL
                      </Label>

                      <Input
                        id="instagram"
                        value={instagramHandle}
                        onChange={(event) =>
                          setInstagramHandle(
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="facebook">
                          Facebook
                        </Label>

                        <Input
                          id="facebook"
                          value={facebook}
                          onChange={(event) =>
                            setFacebook(
                              event.target.value,
                            )
                          }
                          placeholder="Handle or profile URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tiktok">
                          TikTok
                        </Label>

                        <Input
                          id="tiktok"
                          value={tiktok}
                          onChange={(event) =>
                            setTiktok(
                              event.target.value,
                            )
                          }
                          placeholder="Handle or profile URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin">
                          LinkedIn
                        </Label>

                        <Input
                          id="linkedin"
                          value={linkedin}
                          onChange={(event) =>
                            setLinkedin(
                              event.target.value,
                            )
                          }
                          placeholder="Profile or company URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="xHandle">
                          X
                        </Label>

                        <Input
                          id="xHandle"
                          value={xHandle}
                          onChange={(event) =>
                            setXHandle(
                              event.target.value,
                            )
                          }
                          placeholder="Handle or profile URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="youtube">
                          YouTube
                        </Label>

                        <Input
                          id="youtube"
                          value={youtube}
                          onChange={(event) =>
                            setYoutube(
                              event.target.value,
                            )
                          }
                          placeholder="Channel handle or URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="snapchat">
                          Snapchat
                        </Label>

                        <Input
                          id="snapchat"
                          value={snapchat}
                          onChange={(event) =>
                            setSnapchat(
                              event.target.value,
                            )
                          }
                          placeholder="Username or profile URL"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {homepage.storefrontType ===
                  "product" && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Truck className="h-5 w-5 text-primary" />
                        Delivery
                      </CardTitle>

                      <CardDescription>
                        Set a flat delivery fee
                        for all orders.
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryFee">
                          Delivery fee (₦)
                        </Label>

                        <Input
                          id="deliveryFee"
                          type="number"
                          min="0"
                          value={deliveryFee}
                          onChange={(event) =>
                            setDeliveryFee(
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <CustomDomainCard
                  storeId={store.id}
                  storeSlug={store.slug}
                  isPro={isPro}
                  onUpgrade={() =>
                    setShowUpgrade(true)
                  }
                />

                <BankDetailsCard
                  storeId={store.id}
                  storeName={store.name}
                  hasSubaccount={
                    !!store.paystack_subaccount_code
                  }
                  onSubaccountCreated={(
                    code,
                  ) =>
                    typeof setStore ===
                      "function" &&
                    setStore(
                      (
                        previous: any,
                      ) => ({
                        ...previous,
                        paystack_subaccount_code:
                          code,
                      }),
                    )
                  }
                />

                <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={openStorefront}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview storefront
                  </Button>

                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}

                    {saving
                      ? "Saving..."
                      : "Save Settings"}
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>

        <UpgradeModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          storeId={store.id}
        />
      </SidebarProvider>
    </>
  );
};

export default StoreSettings;