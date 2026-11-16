import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  Monitor,
  Package,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Store,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import {
  generateStorefrontContent,
  type BusinessModel,
  type ContentTone,
  type GeneratedContent,
} from "@/storefront/storefrontContentGenerator";

type SetupStep =
  | "identity"
  | "business-model"
  | "category"
  | "offering"
  | "audience"
  | "difference"
  | "action"
  | "branding"
  | "preview"
  | "plan"
  | "complete";

type BrandStyle =
  | "clean-minimal"
  | "modern-professional"
  | "warm-friendly"
  | "premium-elegant"
  | "bold-energetic"
  | "fun-playful";

type SelectedPlan =
  | "free"
  | "pro";

type StoreIdentity = {
  name: string;
  slug: string;
  whatsappNumber: string;
  instagramHandle: string;
  serviceArea: string;
};

type SetupAnswers = {
  businessModel: BusinessModel;
  category: string;
  offering: string;
  targetAudience: string;
  uniqueSellingPoint: string;
  primaryAction: string;
  secondaryAction: string;
  brandStyle: BrandStyle;
  primaryColor: string;
  accentColor: string;
};

type ExistingStore = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  logo_url?: string | null;
  brand_color?: string | null;
  instagram_handle?: string | null;
  whatsapp_number?: string | null;
  storefront_config?: any;
};

type WizardDraft = {
  version: number;
  currentStep: SetupStep;
  identity: StoreIdentity;
  answers: SetupAnswers;
  selectedPlan: SelectedPlan;
  selectedTone: ContentTone;
  rewriteIndex: number;
  generatedContent: GeneratedContent;
  logoPreview: string | null;
  savedAt: string;
};

type ColourCandidate = {
  red: number;
  green: number;
  blue: number;
  count: number;
  saturation: number;
  lightness: number;
  hue: number;
  score: number;
};

const DEFAULT_PRIMARY_COLOR =
  "#4F46E5";

const DEFAULT_ACCENT_COLOR =
  "#7C3AED";

const DRAFT_VERSION = 4;

const DRAFT_STORAGE_PREFIX =
  "storvo-three-model-setup";

const steps: SetupStep[] = [
  "identity",
  "business-model",
  "category",
  "offering",
  "audience",
  "difference",
  "action",
  "branding",
  "preview",
  "plan",
  "complete",
];

const initialIdentity: StoreIdentity = {
  name: "",
  slug: "",
  whatsappNumber: "",
  instagramHandle: "",
  serviceArea: "",
};

const initialAnswers: SetupAnswers = {
  businessModel: "product",
  category: "fashion",
  offering: "",
  targetAudience: "",
  uniqueSellingPoint: "",
  primaryAction: "Shop now",
  secondaryAction: "Browse products",
  brandStyle: "modern-professional",
  primaryColor: DEFAULT_PRIMARY_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
};

const emptyGeneratedContent: GeneratedContent = {
  shortDescription: "",
  headline: "",
  introduction: "",
  aboutTitle: "About us",
  aboutText: "",
  sectionTitle: "",
  sectionSubtitle: "",
  featuredLabel: "",
  featuredText: "",
  services: [],
  trustPoints: [],
  processSteps: [],
  reasons: [],
};

const businessModels: Array<{
  value: BusinessModel;
  title: string;
  description: string;
  icon: typeof ShoppingBag;
}> = [
  {
    value: "product",
    title: "Product Business",
    description:
      "Sell physical products with cart, checkout, inventory and delivery.",
    icon: ShoppingBag,
  },
  {
    value: "service",
    title: "Service Business",
    description:
      "Offer professional services, enquiries, bookings, quotes or consultations.",
    icon: BriefcaseBusiness,
  },
  {
    value: "digital",
    title: "Digital Product Business",
    description:
      "Sell e-books, courses, templates, downloads and other digital resources.",
    icon: Download,
  },
];

const categoryOptions: Record<
  BusinessModel,
  Array<{
    value: string;
    label: string;
    description: string;
  }>
> = {
  product: [
    {
      value: "fashion",
      label: "Fashion and Clothing",
      description:
        "Clothes, accessories and lifestyle fashion.",
    },
    {
      value: "wigs",
      label: "Wigs and Hair",
      description:
        "Human hair, wigs, extensions and hair products.",
    },
    {
      value: "beauty",
      label: "Beauty Products",
      description:
        "Skincare, cosmetics and personal-care products.",
    },
    {
      value: "food",
      label: "Food and Catering",
      description:
        "Meals, baked goods, snacks and food products.",
    },
    {
      value: "electronics",
      label: "Electronics",
      description:
        "Devices, gadgets and accessories.",
    },
    {
      value: "home",
      label: "Home and Lifestyle",
      description:
        "Homeware, décor, furniture and household products.",
    },
    {
      value: "other-product",
      label: "Other Product Business",
      description:
        "Any other physical product category.",
    },
  ],

  service: [
    {
      value: "care-staffing",
      label: "Care and Staffing",
      description:
        "Caregivers, domestic staff, recruitment and placement.",
    },
    {
      value: "cleaning",
      label: "Cleaning Services",
      description:
        "Residential, commercial and specialist cleaning.",
    },
    {
      value: "events",
      label: "Events and Creative Services",
      description:
        "Event planning, coordination, décor, photography and creative support.",
    },
    {
      value: "consulting",
      label: "Consulting",
      description:
        "Professional advice, strategy and expert guidance.",
    },
    {
      value: "beauty-services",
      label: "Beauty Services",
      description:
        "Hair, makeup, skincare and personal beauty services.",
    },
    {
      value: "property-services",
      label: "Property Services",
      description:
        "Property management, inspections and related services.",
    },
    {
      value: "education-training",
      label: "Education and Training",
      description:
        "Tutoring, coaching, courses and professional training.",
    },
    {
      value: "repairs",
      label: "Repairs and Maintenance",
      description:
        "Technical, household and commercial maintenance.",
    },
    {
      value: "professional-services",
      label: "Other Professional Service",
      description:
        "Any other service-led business.",
    },
  ],

  digital: [
    {
      value: "ebooks-guides",
      label: "E-books and Guides",
      description:
        "Downloadable books, guides and written resources.",
    },
    {
      value: "templates",
      label: "Templates",
      description:
        "Business, design, planning and productivity templates.",
    },
    {
      value: "online-courses",
      label: "Online Courses",
      description:
        "Recorded programmes and educational content.",
    },
    {
      value: "digital-art",
      label: "Digital Art and Creative Files",
      description:
        "Artwork, presets, graphics and creative downloads.",
    },
    {
      value: "software-tools",
      label: "Software and Digital Tools",
      description:
        "Apps, licences, utilities and digital tools.",
    },
    {
      value: "other-digital",
      label: "Other Digital Product",
      description:
        "Any other downloadable or online product.",
    },
  ],
};

const actionOptions: Record<
  BusinessModel,
  string[]
> = {
  product: [
    "Shop now",
    "Browse products",
    "View collection",
    "Order now",
  ],

  service: [
    "Make an enquiry",
    "Request a quote",
    "Book a consultation",
    "Hire a worker",
    "Apply for a job",
    "Send a WhatsApp message",
  ],

  digital: [
    "Browse downloads",
    "View digital products",
    "Start learning",
    "Get instant access",
  ],
};

const differenceSuggestions: Record<
  BusinessModel,
  string[]
> = {
  product: [
    "Carefully selected products",
    "Reliable customer support",
    "Quality at accessible prices",
    "Fast order processing",
    "Clear product information",
    "Trusted independent business",
  ],

  service: [
    "Attention to detail",
    "Bespoke service",
    "Professional execution",
    "Clear communication",
    "Fast response",
    "Personalised support",
    "Experienced professionals",
    "Ongoing support",
  ],

  digital: [
    "Practical resources",
    "Instant access",
    "Easy to use",
    "Created by an expert",
    "Saves customers time",
    "Clear step-by-step guidance",
  ],
};

const brandStyles: Array<{
  value: BrandStyle;
  label: string;
  description: string;
  tone: ContentTone;
  className: string;
}> = [
  {
    value: "clean-minimal",
    label: "Clean and Minimal",
    description:
      "Simple, spacious and easy to understand.",
    tone: "professional",
    className:
      "rounded-xl border-slate-200 bg-white text-slate-900",
  },
  {
    value: "modern-professional",
    label: "Modern and Professional",
    description:
      "Clear, credible and business-focused.",
    tone: "professional",
    className:
      "rounded-xl border-blue-200 bg-slate-50 text-blue-950",
  },
  {
    value: "warm-friendly",
    label: "Warm and Friendly",
    description:
      "Welcoming, reassuring and approachable.",
    tone: "warm",
    className:
      "rounded-3xl border-orange-200 bg-orange-50 text-orange-950",
  },
  {
    value: "premium-elegant",
    label: "Premium and Elegant",
    description:
      "Refined, polished and luxurious.",
    tone: "premium",
    className:
      "rounded-sm border-amber-300 bg-stone-950 text-amber-100",
  },
  {
    value: "bold-energetic",
    label: "Bold and Energetic",
    description:
      "Strong, confident and attention-grabbing.",
    tone: "bold",
    className:
      "rounded-xl border-slate-950 bg-slate-950 text-white",
  },
  {
    value: "fun-playful",
    label: "Fun and Playful",
    description:
      "Colourful, lively and full of personality.",
    tone: "friendly",
    className:
      "rounded-3xl border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950",
  },
];

const isValidStoreId = (
  value: string | null,
) =>
  Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
  const generateSlug = (
  value: string,
) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getToneFromStyle = (
  style: BrandStyle,
): ContentTone =>
  brandStyles.find(
    (item) =>
      item.value === style,
  )?.tone || "professional";

const getDraftKey = (
  userId: string,
  storeId: string | null,
) =>
  `${DRAFT_STORAGE_PREFIX}:${userId}:${storeId || "new"}`;

const readDraft = (
  key: string,
): WizardDraft | null => {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as WizardDraft;

    if (
      parsed.version !==
      DRAFT_VERSION
    ) {
      localStorage.removeItem(
        key,
      );

      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(
      key,
    );

    return null;
  }
};

const DRAFT_DB_NAME =
  "storvo-setup-drafts";

const DRAFT_DB_STORE =
  "logos";

const openDraftDatabase = () =>
  new Promise<IDBDatabase>(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          DRAFT_DB_NAME,
          1,
        );

      request.onupgradeneeded =
        () => {
          const database =
            request.result;

          if (
            !database.objectStoreNames.contains(
              DRAFT_DB_STORE,
            )
          ) {
            database.createObjectStore(
              DRAFT_DB_STORE,
            );
          }
        };

      request.onsuccess = () =>
        resolve(
          request.result,
        );

      request.onerror = () =>
        reject(
          request.error,
        );
    },
  );

const saveDraftLogo = async (
  key: string,
  file: File,
) => {
  const database =
    await openDraftDatabase();

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          DRAFT_DB_STORE,
          "readwrite",
        );

      transaction
        .objectStore(
          DRAFT_DB_STORE,
        )
        .put(
          file,
          key,
        );

      transaction.oncomplete =
        () => resolve();

      transaction.onerror =
        () =>
          reject(
            transaction.error,
          );
    },
  );

  database.close();
};

const loadDraftLogo = async (
  key: string,
) => {
  const database =
    await openDraftDatabase();

  const file =
    await new Promise<File | null>(
      (resolve, reject) => {
        const transaction =
          database.transaction(
            DRAFT_DB_STORE,
            "readonly",
          );

        const request =
          transaction
            .objectStore(
              DRAFT_DB_STORE,
            )
            .get(key);

        request.onsuccess =
          () =>
            resolve(
              request.result instanceof
                File
                ? request.result
                : null,
            );

        request.onerror =
          () =>
            reject(
              request.error,
            );
      },
    );

  database.close();

  return file;
};

const deleteDraftLogo = async (
  key: string,
) => {
  const database =
    await openDraftDatabase();

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          DRAFT_DB_STORE,
          "readwrite",
        );

      transaction
        .objectStore(
          DRAFT_DB_STORE,
        )
        .delete(key);

      transaction.oncomplete =
        () => resolve();

      transaction.onerror =
        () =>
          reject(
            transaction.error,
          );
    },
  );

  database.close();
};

const rgbToHex = (
  red: number,
  green: number,
  blue: number,
) =>
  `#${[
    red,
    green,
    blue,
  ]
    .map((value) =>
      Math.max(
        0,
        Math.min(
          255,
          Math.round(value),
        ),
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();

const rgbToHsl = (
  red: number,
  green: number,
  blue: number,
) => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;

  const maximum =
    Math.max(r, g, b);

  const minimum =
    Math.min(r, g, b);

  const delta =
    maximum - minimum;

  const lightness =
    (maximum + minimum) / 2;

  if (delta === 0) {
    return {
      hue: 0,
      saturation: 0,
      lightness,
    };
  }

  const saturation =
    delta /
    (1 -
      Math.abs(
        2 * lightness - 1,
      ));

  let hue = 0;

  if (maximum === r) {
    hue =
      60 *
      (((g - b) / delta) %
        6);
  } else if (
    maximum === g
  ) {
    hue =
      60 *
      ((b - r) / delta +
        2);
  } else {
    hue =
      60 *
      ((r - g) / delta +
        4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    hue,
    saturation,
    lightness,
  };
};

const colourDistance = (
  first: ColourCandidate,
  second: ColourCandidate,
) => {
  const redDifference =
    first.red - second.red;

  const greenDifference =
    first.green -
    second.green;

  const blueDifference =
    first.blue -
    second.blue;

  return Math.sqrt(
    redDifference ** 2 +
      greenDifference ** 2 +
      blueDifference ** 2,
  );
};

const hueDistance = (
  firstHue: number,
  secondHue: number,
) => {
  const difference =
    Math.abs(
      firstHue -
        secondHue,
    );

  return Math.min(
    difference,
    360 - difference,
  );
};

const createImageFromFile = (
  file: File,
) =>
  new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const objectUrl =
        URL.createObjectURL(
          file,
        );

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl,
        );

        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl,
        );

        reject(
          new Error(
            "The logo could not be analysed.",
          ),
        );
      };

      image.src =
        objectUrl;
    },
  );

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) =>
  new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(
            new Error(
              "The logo could not be prepared.",
            ),
          );
        },
        type,
        quality,
      );
    },
  );
  const prepareLogoFile = async (
  file: File,
) => {
  const maximumDimension =
    900;

  const image =
    await createImageFromFile(
      file,
    );

  const largestDimension =
    Math.max(
      image.width,
      image.height,
    );

  if (
    largestDimension <=
      maximumDimension &&
    file.size <=
      1_500_000
  ) {
    return file;
  }

  const scale =
    Math.min(
      1,
      maximumDimension /
        largestDimension,
    );

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          scale,
      ),
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          scale,
      ),
    );

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width = width;
  canvas.height =
    height;

  const context =
    canvas.getContext(
      "2d",
    );

  if (!context) {
    throw new Error(
      "The logo could not be prepared.",
    );
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height,
  );

  const preferredType =
    file.type ===
    "image/png"
      ? "image/png"
      : "image/jpeg";

  const blob =
    await canvasToBlob(
      canvas,
      preferredType,
      preferredType ===
        "image/jpeg"
        ? 0.88
        : undefined,
    );

  const extension =
    preferredType ===
    "image/png"
      ? "png"
      : "jpg";

  const baseName =
    file.name
      .replace(
        /\.[^.]+$/,
        "",
      )
      .replace(
        /[^a-z0-9_-]+/gi,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      ) || "logo";

  return new File(
    [blob],
    `${baseName}.${extension}`,
    {
      type:
        preferredType,
      lastModified:
        Date.now(),
    },
  );
};

const extractBrandColours = async (
  file: File,
) => {
  const image =
    await createImageFromFile(
      file,
    );

  const sampleSize =
    120;

  const ratio =
    Math.min(
      sampleSize /
        image.width,
      sampleSize /
        image.height,
      1,
    );

  const width =
    Math.max(
      1,
      Math.round(
        image.width *
          ratio,
      ),
    );

  const height =
    Math.max(
      1,
      Math.round(
        image.height *
          ratio,
      ),
    );

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width = width;
  canvas.height =
    height;

  const context =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      },
    );

  if (!context) {
    return null;
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height,
  );

  const data =
    context.getImageData(
      0,
      0,
      width,
      height,
    ).data;

  const buckets =
    new Map<
      string,
      ColourCandidate
    >();

  for (
    let index = 0;
    index < data.length;
    index += 4
  ) {
    const alpha =
      data[index + 3];

    if (
      alpha < 100
    ) {
      continue;
    }

    const red =
      data[index];

    const green =
      data[index + 1];

    const blue =
      data[index + 2];

    const {
      hue,
      saturation,
      lightness,
    } = rgbToHsl(
      red,
      green,
      blue,
    );

    if (
      lightness >
        0.96 ||
      lightness <
        0.04
    ) {
      continue;
    }

    const quantisedRed =
      Math.round(
        red / 24,
      ) * 24;

    const quantisedGreen =
      Math.round(
        green / 24,
      ) * 24;

    const quantisedBlue =
      Math.round(
        blue / 24,
      ) * 24;

    const key =
      `${quantisedRed}-${quantisedGreen}-${quantisedBlue}`;

    const existing =
      buckets.get(key);

    const score =
      1 +
      saturation * 2 +
      (1 -
        Math.abs(
          lightness -
            0.5,
        )) *
        0.5;

    if (existing) {
      existing.count +=
        1;

      existing.score +=
        score;

      continue;
    }

    buckets.set(key, {
      red:
        Math.min(
          255,
          quantisedRed,
        ),
      green:
        Math.min(
          255,
          quantisedGreen,
        ),
      blue:
        Math.min(
          255,
          quantisedBlue,
        ),
      count: 1,
      saturation,
      lightness,
      hue,
      score,
    });
  }

  const candidates =
    Array.from(
      buckets.values(),
    )
      .map(
        (
          candidate,
        ) => ({
          ...candidate,
          score:
            candidate.score *
            Math.log2(
              candidate.count +
                2,
            ),
        }),
      )
      .sort(
        (first, second) =>
          second.score -
          first.score,
      );

  if (
    candidates.length ===
    0
  ) {
    return null;
  }

  const primary =
    candidates[0];

  const accent =
    candidates.find(
      (candidate) =>
        colourDistance(
          primary,
          candidate,
        ) > 80 &&
        hueDistance(
          primary.hue,
          candidate.hue,
        ) > 35,
    ) ||
    candidates.find(
      (candidate) =>
        colourDistance(
          primary,
          candidate,
        ) > 65,
    ) ||
    candidates[1] ||
    primary;

  return {
    primaryColor:
      rgbToHex(
        primary.red,
        primary.green,
        primary.blue,
      ),
    accentColor:
      rgbToHex(
        accent.red,
        accent.green,
        accent.blue,
      ),
  };
};

const cleanText = (
  value: string,
) =>
  value
    .replace(
      /\u00a0/g,
      " ",
    )
    .replace(
      /â€¦|Â…/g,
      "…",
    )
    .replace(
      /â€™|Â’/g,
      "'",
    )
    .replace(
      /â€œ|â€|Â“|Â”/g,
      '"',
    )
    .replace(
      /â€“|Â–/g,
      "–",
    )
    .replace(
      /â€”|Â—/g,
      "—",
    )
    .replace(
      /â‚¦|Â₦/g,
      "₦",
    )
    .replace(
      /â€Œ|Â/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();

const cleanGeneratedContent = (
  content: GeneratedContent,
): GeneratedContent => ({
  shortDescription:
    cleanText(
      content.shortDescription,
    ),
  headline:
    cleanText(
      content.headline,
    ),
  introduction:
    cleanText(
      content.introduction,
    ),
  aboutTitle:
    cleanText(
      content.aboutTitle,
    ),
  aboutText:
    cleanText(
      content.aboutText,
    ),
  sectionTitle:
    cleanText(
      content.sectionTitle,
    ),
  sectionSubtitle:
    cleanText(
      content.sectionSubtitle,
    ),
  featuredLabel:
    cleanText(
      content.featuredLabel,
    ),
  featuredText:
    cleanText(
      content.featuredText,
    ),
  services:
    content.services.map(
      (service) => ({
        ...service,
        title:
          cleanText(
            service.title,
          ),
        description:
          cleanText(
            service.description,
          ),
      }),
    ),
  trustPoints:
    content.trustPoints.map(
      cleanText,
    ),
  processSteps:
    content.processSteps.map(
      (step) => ({
        title:
          cleanText(
            step.title,
          ),
        description:
          cleanText(
            step.description,
          ),
      }),
    ),
  reasons:
    content.reasons.map(
      cleanText,
    ),
});

const getCategoryLabel = (
  businessModel: BusinessModel,
  category: string,
) =>
  categoryOptions[
    businessModel
  ].find(
    (item) =>
      item.value ===
      category,
  )?.label ||
  category;

const normalisePhone = (
  value: string,
) =>
  value
    .replace(
      /[^\d+]/g,
      "",
    )
    .trim();

const normaliseInstagram = (
  value: string,
) =>
  value
    .trim()
    .replace(
      /^@/,
      "",
    );

const StepHeading = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <div className="mb-8">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
      {eyebrow}
    </p>

    <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
      {title}
    </h2>

    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
      {description}
    </p>
  </div>
);

const SelectionCard = ({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon?: typeof ShoppingBag;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={
      onClick
    }
    className={`w-full rounded-2xl border p-5 text-left transition ${
      selected
        ? "border-primary bg-primary/5 ring-2 ring-primary/10"
        : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
    }`}
  >
    <div className="flex items-start gap-4">
      {Icon ? (
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="font-bold text-foreground">
            {title}
          </p>

          {selected ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  </button>
);
const PlanCard = ({
  selected,
  title,
  price,
  priceSuffix,
  description,
  features,
  recommended = false,
  onClick,
}: {
  selected: boolean;
  title: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: string[];
  recommended?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative rounded-3xl border p-6 text-left transition-all ${
      selected
        ? "border-primary bg-primary/5 ring-2 ring-primary/15"
        : "border-border bg-card hover:border-primary/40"
    }`}
  >
    {recommended ? (
      <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
        Recommended
      </span>
    ) : null}

    <div className="flex items-center justify-between gap-4">
      <p className="text-xl font-black text-foreground">
        {title}
      </p>

      {selected ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </span>
      ) : null}
    </div>

    <p className="mt-3 text-3xl font-black text-foreground">
      {price}
      {priceSuffix ? (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {priceSuffix}
        </span>
      ) : null}
    </p>

    <p className="mt-3 text-sm leading-6 text-muted-foreground">
      {description}
    </p>

    <ul className="mt-6 space-y-3 text-sm text-foreground">
      {features.map(
        (feature) => (
          <li
            key={feature}
            className="flex items-start gap-2"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ),
      )}
    </ul>
  </button>
);

const StoreSetupWizard = () => {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const { user } =
    useAuth();

  const rawStoreId =
    searchParams.get(
      "storeId",
    );

  const storeId =
    isValidStoreId(
      rawStoreId,
    )
      ? rawStoreId
      : null;

  const isEditMode =
    Boolean(storeId);

  const [
    currentStepIndex,
    setCurrentStepIndex,
  ] = useState(0);

  const [
    identity,
    setIdentity,
  ] =
    useState<StoreIdentity>(
      initialIdentity,
    );

  const [
    answers,
    setAnswers,
  ] =
    useState<SetupAnswers>(
      initialAnswers,
    );

  const [
    selectedPlan,
    setSelectedPlan,
  ] =
    useState<SelectedPlan>(
      "free",
    );

  const [
    selectedTone,
    setSelectedTone,
  ] =
    useState<ContentTone>(
      "professional",
    );

  const [
    rewriteIndex,
    setRewriteIndex,
  ] =
    useState(0);

  const [
    generatedContent,
    setGeneratedContent,
  ] =
    useState<GeneratedContent>(
      emptyGeneratedContent,
    );

  const [
    existingStore,
    setExistingStore,
  ] =
    useState<ExistingStore | null>(
      null,
    );

  const [
    logoFile,
    setLogoFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    logoPreview,
    setLogoPreview,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      isEditMode,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    uploadingLogo,
    setUploadingLogo,
  ] =
    useState(false);

  const [
    hasLoadedDraft,
    setHasLoadedDraft,
  ] =
    useState(false);

  const [
    slugTouched,
    setSlugTouched,
  ] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const currentStep =
    steps[
      currentStepIndex
    ];

  const currentCategoryOptions =
    categoryOptions[
      answers.businessModel
    ];

  const currentActionOptions =
    actionOptions[
      answers.businessModel
    ];

  const draftKey =
    useMemo(
      () =>
        user?.id
          ? getDraftKey(
              user.id,
              storeId,
            )
          : null,
      [
        user?.id,
        storeId,
      ],
    );

  const progress =
    Math.round(
      ((currentStepIndex + 1) /
        steps.length) *
        100,
    );

  const previewContent =
    useMemo(() => {
      const businessName =
        cleanText(
          identity.name,
        );

      const offering =
        cleanText(
          answers.offering,
        );

      if (
        !businessName ||
        !offering
      ) {
        return emptyGeneratedContent;
      }

      return cleanGeneratedContent(
        generateStorefrontContent({
          businessName,
          businessModel:
            answers.businessModel,
          category:
            answers.category,
          offering,
          targetAudience:
            cleanText(
              answers.targetAudience,
            ),
          uniqueSellingPoint:
            cleanText(
              answers.uniqueSellingPoint,
            ),
          serviceArea:
            cleanText(
              identity.serviceArea,
            ),
          tone:
            selectedTone,
          rewriteIndex,
        }),
      );
    }, [
      identity.name,
      identity.serviceArea,
      answers.businessModel,
      answers.category,
      answers.offering,
      answers.targetAudience,
      answers.uniqueSellingPoint,
      selectedTone,
      rewriteIndex,
    ]);

  useEffect(() => {
    if (
      !rawStoreId
    ) {
      return;
    }

    if (
      !isValidStoreId(
        rawStoreId,
      )
    ) {
      toast.error(
        "The store link is invalid.",
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    }
  }, [
    rawStoreId,
    navigate,
  ]);

  useEffect(() => {
    if (
      !user?.id ||
      !storeId
    ) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadStore =
      async () => {
        setLoading(true);

        const {
          data,
          error,
        } =
          await supabase
            .from("stores")
            .select(
              "id,user_id,name,slug,description,category,logo_url,brand_color,instagram_handle,whatsapp_number,storefront_config",
            )
            .eq(
              "id",
              storeId,
            )
            .maybeSingle();

        if (
          cancelled
        ) {
          return;
        }

        if (
          error ||
          !data
        ) {
          toast.error(
            "Store not found.",
          );

          navigate(
            "/dashboard",
            {
              replace: true,
            },
          );

          return;
        }

        const store =
  data as unknown as ExistingStore;

        if (
          store.user_id !==
          user.id
        ) {
          toast.error(
            "You do not have permission to edit this store.",
          );

          navigate(
            "/dashboard",
            {
              replace: true,
            },
          );

          return;
        }

        setExistingStore(
          store,
        );

        const config =
          store.storefront_config ||
          {};

        const businessModel =
          (
            config.businessModel ||
            config.business_model ||
            "product"
          ) as BusinessModel;

        const category =
          config.category ||
          store.category ||
          categoryOptions[
            businessModel
          ][0]?.value ||
          "fashion";

        const storedIdentity: StoreIdentity =
          {
            name:
              cleanText(
                store.name ||
                  "",
              ),
            slug:
              cleanText(
                store.slug ||
                  "",
              ),
            whatsappNumber:
              cleanText(
                store.whatsapp_number ||
                  "",
              ),
            instagramHandle:
              cleanText(
                store.instagram_handle ||
                  "",
              ),
            serviceArea:
              cleanText(
                config.serviceArea ||
                  config.service_area ||
                  "",
              ),
          };

        const storedAnswers: SetupAnswers =
          {
            businessModel,
            category,
            offering:
              cleanText(
                config.offering ||
                  store.description ||
                  "",
              ),
            targetAudience:
              cleanText(
                config.targetAudience ||
                  config.target_audience ||
                  "",
              ),
            uniqueSellingPoint:
              cleanText(
                config.uniqueSellingPoint ||
                  config.unique_selling_point ||
                  "",
              ),
            primaryAction:
              cleanText(
                config.primaryAction ||
                  config.primary_action ||
                  actionOptions[
                    businessModel
                  ][0],
              ),
            secondaryAction:
              cleanText(
                config.secondaryAction ||
                  config.secondary_action ||
                  actionOptions[
                    businessModel
                  ][1] ||
                  actionOptions[
                    businessModel
                  ][0],
              ),
            brandStyle:
              (config.brandStyle ||
                config.brand_style ||
                "modern-professional") as BrandStyle,
            primaryColor:
              cleanText(
                config.primaryColor ||
                  config.primary_color ||
                  store.brand_color ||
                  DEFAULT_PRIMARY_COLOR,
              ),
            accentColor:
              cleanText(
                config.accentColor ||
                  config.accent_color ||
                  DEFAULT_ACCENT_COLOR,
              ),
          };

        setIdentity(
          storedIdentity,
        );

        setAnswers(
          storedAnswers,
        );

        setSelectedTone(
          (config.contentTone ||
            config.content_tone ||
            getToneFromStyle(
              storedAnswers.brandStyle,
            )) as ContentTone,
        );

        setSelectedPlan(
          config.plan ===
            "pro"
            ? "pro"
            : "free",
        );

        if (
          store.logo_url
        ) {
          setLogoPreview(
            store.logo_url,
          );
        }

        setSlugTouched(
          true,
        );

        setLoading(false);
      };

    void loadStore();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    storeId,
    navigate,
  ]);
    useEffect(() => {
    if (
      !draftKey ||
      hasLoadedDraft
    ) {
      return;
    }

    const draft =
      readDraft(
        draftKey,
      );

    if (!draft) {
      setHasLoadedDraft(
        true,
      );

      return;
    }

    setIdentity({
      ...initialIdentity,
      ...draft.identity,
      name:
        cleanText(
          draft.identity.name ||
            "",
        ),
      slug:
        cleanText(
          draft.identity.slug ||
            "",
        ),
      whatsappNumber:
        cleanText(
          draft.identity.whatsappNumber ||
            "",
        ),
      instagramHandle:
        cleanText(
          draft.identity.instagramHandle ||
            "",
        ),
      serviceArea:
        cleanText(
          draft.identity.serviceArea ||
            "",
        ),
    });

    setAnswers({
      ...initialAnswers,
      ...draft.answers,
      offering:
        cleanText(
          draft.answers.offering ||
            "",
        ),
      targetAudience:
        cleanText(
          draft.answers.targetAudience ||
            "",
        ),
      uniqueSellingPoint:
        cleanText(
          draft.answers.uniqueSellingPoint ||
            "",
        ),
      primaryAction:
        cleanText(
          draft.answers.primaryAction ||
            "",
        ),
      secondaryAction:
        cleanText(
          draft.answers.secondaryAction ||
            "",
        ),
      primaryColor:
        cleanText(
          draft.answers.primaryColor ||
            DEFAULT_PRIMARY_COLOR,
        ),
      accentColor:
        cleanText(
          draft.answers.accentColor ||
            DEFAULT_ACCENT_COLOR,
        ),
    });

    setSelectedPlan(
      draft.selectedPlan ||
        "free",
    );

    setSelectedTone(
      draft.selectedTone ||
        "professional",
    );

    setRewriteIndex(
      Number.isFinite(
        draft.rewriteIndex,
      )
        ? draft.rewriteIndex
        : 0,
    );

    setGeneratedContent(
      cleanGeneratedContent(
        draft.generatedContent ||
          emptyGeneratedContent,
      ),
    );

    setCurrentStepIndex(
      Math.max(
        0,
        steps.indexOf(
          draft.currentStep,
        ),
      ),
    );

    if (
      draft.logoPreview
    ) {
      setLogoPreview(
        draft.logoPreview,
      );
    }

    void loadDraftLogo(
      draftKey,
    )
      .then((file) => {
        if (!file) {
          return;
        }

        setLogoFile(file);

        const preview =
          URL.createObjectURL(
            file,
          );

        setLogoPreview(
          preview,
        );
      })
      .catch(() => undefined);

    setSlugTouched(
      Boolean(
        draft.identity.slug,
      ),
    );

    setHasLoadedDraft(
      true,
    );
  }, [
    draftKey,
    hasLoadedDraft,
  ]);

  useEffect(() => {
    if (
      !draftKey ||
      !hasLoadedDraft ||
      currentStep ===
        "complete"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          const draft: WizardDraft =
            {
              version:
                DRAFT_VERSION,
              currentStep,
              identity: {
                ...identity,
                name:
                  cleanText(
                    identity.name,
                  ),
                slug:
                  cleanText(
                    identity.slug,
                  ),
                whatsappNumber:
                  cleanText(
                    identity.whatsappNumber,
                  ),
                instagramHandle:
                  cleanText(
                    identity.instagramHandle,
                  ),
                serviceArea:
                  cleanText(
                    identity.serviceArea,
                  ),
              },
              answers: {
                ...answers,
                offering:
                  cleanText(
                    answers.offering,
                  ),
                targetAudience:
                  cleanText(
                    answers.targetAudience,
                  ),
                uniqueSellingPoint:
                  cleanText(
                    answers.uniqueSellingPoint,
                  ),
                primaryAction:
                  cleanText(
                    answers.primaryAction,
                  ),
                secondaryAction:
                  cleanText(
                    answers.secondaryAction,
                  ),
                primaryColor:
                  cleanText(
                    answers.primaryColor,
                  ),
                accentColor:
                  cleanText(
                    answers.accentColor,
                  ),
              },
              selectedPlan,
              selectedTone,
              rewriteIndex,
              generatedContent:
                cleanGeneratedContent(
                  previewContent,
                ),
              logoPreview:
                logoFile
                  ? null
                  : logoPreview,
              savedAt:
                new Date().toISOString(),
            };

          try {
            localStorage.setItem(
              draftKey,
              JSON.stringify(
                draft,
              ),
            );
          } catch {
            // Draft saving is best-effort only.
          }
        },
        350,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    draftKey,
    hasLoadedDraft,
    currentStep,
    identity,
    answers,
    selectedPlan,
    selectedTone,
    rewriteIndex,
    previewContent,
    logoFile,
    logoPreview,
  ]);

  useEffect(() => {
    if (
      slugTouched ||
      isEditMode
    ) {
      return;
    }

    setIdentity(
      (current) => ({
        ...current,
        slug:
          generateSlug(
            current.name,
          ),
      }),
    );
  }, [
    identity.name,
    slugTouched,
    isEditMode,
  ]);

  useEffect(() => {
    const options =
      categoryOptions[
        answers.businessModel
      ];

    if (
      options.some(
        (item) =>
          item.value ===
          answers.category,
      )
    ) {
      return;
    }

    setAnswers(
      (current) => ({
        ...current,
        category:
          options[0]
            ?.value ||
          "",
        primaryAction:
          actionOptions[
            current.businessModel
          ][0] || "",
        secondaryAction:
          actionOptions[
            current.businessModel
          ][1] ||
          actionOptions[
            current.businessModel
          ][0] ||
          "",
      }),
    );
  }, [
    answers.businessModel,
    answers.category,
  ]);

  useEffect(() => {
    const styleTone =
      getToneFromStyle(
        answers.brandStyle,
      );

    setSelectedTone(
      styleTone,
    );
  }, [
    answers.brandStyle,
  ]);

  const clearDraft =
    async () => {
      if (!draftKey) {
        return;
      }

      try {
        localStorage.removeItem(
          draftKey,
        );

        await deleteDraftLogo(
          draftKey,
        );
      } catch {
        // Cleanup is best-effort only.
      }
    };

  const updateIdentity = <
    Key extends keyof StoreIdentity,
  >(
    key: Key,
    value: StoreIdentity[Key],
  ) => {
    setIdentity(
      (current) => ({
        ...current,
        [key]:
          typeof value ===
          "string"
            ? cleanText(
                value,
              )
            : value,
      }),
    );
  };

  const updateAnswer = <
    Key extends keyof SetupAnswers,
  >(
    key: Key,
    value: SetupAnswers[Key],
  ) => {
    setAnswers(
      (current) => ({
        ...current,
        [key]:
          typeof value ===
          "string"
            ? cleanText(
                value,
              )
            : value,
      }),
    );
  };

  const handleLogoChange =
    async (
      file: File | null,
    ) => {
      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/",
        )
      ) {
        toast.error(
          "Please choose an image file.",
        );

        return;
      }

      try {
        setUploadingLogo(
          true,
        );

        const preparedFile =
          await prepareLogoFile(
            file,
          );

        setLogoFile(
          preparedFile,
        );

        if (
          draftKey
        ) {
          await saveDraftLogo(
            draftKey,
            preparedFile,
          );
        }

        const objectUrl =
          URL.createObjectURL(
            preparedFile,
          );

        setLogoPreview(
          objectUrl,
        );

        const colours =
          await extractBrandColours(
            preparedFile,
          );

        if (colours) {
          setAnswers(
            (current) => ({
              ...current,
              primaryColor:
                colours.primaryColor,
              accentColor:
                colours.accentColor,
            }),
          );

          toast.success(
            "Brand colours detected from your logo.",
          );
        }
      } catch (
        error
      ) {
        console.error(
          error,
        );

        toast.error(
          "The logo could not be prepared.",
        );
      } finally {
        setUploadingLogo(
          false,
        );
      }
    };

  const removeLogo =
    async () => {
      setLogoFile(
        null,
      );

      setLogoPreview(
        existingStore?.logo_url ||
          null,
      );

      if (
        draftKey
      ) {
        try {
          await deleteDraftLogo(
            draftKey,
          );
        } catch {
          // Best-effort cleanup.
        }
      }
    };

  const validateCurrentStep =
    () => {
      switch (
        currentStep
      ) {
        case "identity":
          if (
            !cleanText(
              identity.name,
            )
          ) {
            toast.error(
              "Enter your business name.",
            );

            return false;
          }

          if (
            !cleanText(
              identity.slug,
            )
          ) {
            toast.error(
              "Enter a website address.",
            );

            return false;
          }

          return true;

        case "business-model":
          return Boolean(
            answers.businessModel,
          );

        case "category":
          return Boolean(
            answers.category,
          );

        case "offering":
          if (
            !cleanText(
              answers.offering,
            )
          ) {
            toast.error(
              answers.businessModel ===
                "service"
                ? "Tell us what services you offer."
                : answers.businessModel ===
                    "digital"
                  ? "Tell us what digital products you offer."
                  : "Tell us what products you sell.",
            );

            return false;
          }

          return true;

        case "audience":
          if (
            !cleanText(
              answers.targetAudience,
            )
          ) {
            toast.error(
              "Tell us who your ideal customers are.",
            );

            return false;
          }

          return true;

        case "difference":
          if (
            !cleanText(
              answers.uniqueSellingPoint,
            )
          ) {
            toast.error(
              "Tell us what makes your business different.",
            );

            return false;
          }

          return true;

        case "action":
          if (
            !cleanText(
              answers.primaryAction,
            )
          ) {
            toast.error(
              "Choose the main action customers should take.",
            );

            return false;
          }

          return true;

        default:
          return true;
      }
    };

  const goNext =
    () => {
      if (
        !validateCurrentStep()
      ) {
        return;
      }

      setCurrentStepIndex(
        (current) =>
          Math.min(
            current + 1,
            steps.length - 1,
          ),
      );
    };

  const goBack =
    () => {
      if (
        currentStepIndex ===
        0
      ) {
        navigate(
          "/dashboard",
        );

        return;
      }

      setCurrentStepIndex(
        (current) =>
          Math.max(
            0,
            current - 1,
          ),
      );
    };

  const rewritePreviewContent =
    () => {
      setRewriteIndex(
        (current) =>
          current + 1,
      );
    };
      const uploadLogoIfNeeded =
    async (
      targetStoreId: string,
    ) => {
      if (!logoFile) {
        return (
          existingStore?.logo_url ||
          null
        );
      }

      const extension =
        logoFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "png";

      const path =
        `${targetStoreId}/logo-${Date.now()}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("store-assets")
          .upload(
            path,
            logoFile,
            {
              cacheControl:
                "3600",
              upsert: true,
            },
          );

      if (
        uploadError
      ) {
        throw uploadError;
      }

      const {
        data,
      } =
        supabase.storage
          .from("store-assets")
          .getPublicUrl(
            path,
          );

      return (
        data.publicUrl ||
        null
      );
    };

  const buildStorefrontConfig =
    (
      finalContent: GeneratedContent,
    ) => ({
      businessModel:
        answers.businessModel,
      category:
        answers.category,
      offering:
        cleanText(
          answers.offering,
        ),
      targetAudience:
        cleanText(
          answers.targetAudience,
        ),
      uniqueSellingPoint:
        cleanText(
          answers.uniqueSellingPoint,
        ),
      primaryAction:
        cleanText(
          answers.primaryAction,
        ),
      secondaryAction:
        cleanText(
          answers.secondaryAction,
        ),
      serviceArea:
        cleanText(
          identity.serviceArea,
        ),
      brandStyle:
        answers.brandStyle,
      primaryColor:
        answers.primaryColor,
      accentColor:
        answers.accentColor,
      contentTone:
        selectedTone,
      generatedContent:
        cleanGeneratedContent(
          finalContent,
        ),
      plan:
        selectedPlan,
      setupVersion:
        DRAFT_VERSION,
      updatedAt:
        new Date().toISOString(),
    });

  const finishSetup =
    async () => {
      if (
        !user?.id
      ) {
        toast.error(
          "Please sign in again.",
        );

        return;
      }

      if (
        !cleanText(
          identity.name,
        ) ||
        !cleanText(
          identity.slug,
        )
      ) {
        toast.error(
          "Your business name and website address are required.",
        );

        return;
      }

      if (
        !cleanText(
          answers.offering,
        )
      ) {
        toast.error(
          "Tell us what your business offers.",
        );

        return;
      }

      const finalContent =
        cleanGeneratedContent(
          previewContent,
        );

      setGeneratedContent(
        finalContent,
      );

      setSaving(true);

      try {
        const cleanName =
          cleanText(
            identity.name,
          );

        const cleanSlug =
          generateSlug(
            identity.slug,
          );

        const cleanWhatsapp =
          normalisePhone(
            identity.whatsappNumber,
          );

        const cleanInstagram =
          normaliseInstagram(
            identity.instagramHandle,
          );

        if (
          !cleanSlug
        ) {
          throw new Error(
            "Please enter a valid website address.",
          );
        }

        const {
          data:
            conflictingStore,
        } =
          await supabase
            .from("stores")
            .select("id")
            .eq(
              "slug",
              cleanSlug,
            )
            .neq(
              "id",
              storeId ||
                "00000000-0000-0000-0000-000000000000",
            )
            .maybeSingle();

        if (
          conflictingStore
        ) {
          toast.error(
            "That website address is already in use. Please choose another one.",
          );

          setCurrentStepIndex(
            steps.indexOf(
              "identity",
            ),
          );

          setSaving(false);

          return;
        }

        let targetStoreId =
          storeId;

        if (
          targetStoreId
        ) {
          const {
            data:
              ownershipCheck,
            error:
              ownershipError,
          } =
            await supabase
              .from("stores")
              .select(
                "id,user_id",
              )
              .eq(
                "id",
                targetStoreId,
              )
              .maybeSingle();

          if (
            ownershipError ||
            !ownershipCheck
          ) {
            throw new Error(
              "The store could not be found.",
            );
          }

          if (
            ownershipCheck.user_id !==
            user.id
          ) {
            throw new Error(
              "You do not have permission to update this store.",
            );
          }
        } else {
          const {
            data:
              createdStore,
            error:
              createError,
          } =
            await supabase
              .from("stores")
              .insert({
                user_id:
                  user.id,
                name:
                  cleanName,
                slug:
                  cleanSlug,
                description:
                  finalContent.shortDescription,
                category:
                  answers.category,
                brand_color:
                  answers.primaryColor,
                instagram_handle:
                  cleanInstagram ||
                  null,
                whatsapp_number:
                  cleanWhatsapp ||
                  null,
                storefront_config:
                  buildStorefrontConfig(
                    finalContent,
                  ),
              } as any)
              .select(
                "id",
              )
              .single();

          if (
            createError
          ) {
            throw createError;
          }

          targetStoreId =
            createdStore.id;
        }

        if (
          !targetStoreId
        ) {
          throw new Error(
            "The store could not be created.",
          );
        }

        setUploadingLogo(
          Boolean(
            logoFile,
          ),
        );

        const logoUrl =
          await uploadLogoIfNeeded(
            targetStoreId,
          );

        setUploadingLogo(
          false,
        );

        const config =
          buildStorefrontConfig(
            finalContent,
          );

        const {
          error:
            updateError,
        } =
          await supabase
            .from("stores")
            .update({
              name:
                cleanName,
              slug:
                cleanSlug,
              description:
                finalContent.shortDescription,
              category:
                answers.category,
              logo_url:
                logoUrl,
              brand_color:
                answers.primaryColor,
              instagram_handle:
                cleanInstagram ||
                null,
              whatsapp_number:
                cleanWhatsapp ||
                null,
              storefront_config:
                config,
            } as any)
            .eq(
              "id",
              targetStoreId,
            )
            .eq(
              "user_id",
              user.id,
            );

        if (
          updateError
        ) {
          throw updateError;
        }

        await clearDraft();

        setExistingStore(
          (current) => ({
            id:
              targetStoreId!,
            user_id:
              user.id,
            name:
              cleanName,
            slug:
              cleanSlug,
            description:
              finalContent.shortDescription,
            category:
              answers.category,
            logo_url:
              logoUrl,
            brand_color:
              answers.primaryColor,
            instagram_handle:
              cleanInstagram ||
              null,
            whatsapp_number:
              cleanWhatsapp ||
              null,
            storefront_config:
              config,
            ...current,
          }),
        );

        setCurrentStepIndex(
          steps.indexOf(
            "complete",
          ),
        );

        toast.success(
          isEditMode
            ? "Your website has been updated."
            : "Your website is ready.",
        );
      } catch (
        error
      ) {
        console.error(
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Your website could not be saved.",
        );
      } finally {
        setSaving(false);
        setUploadingLogo(
          false,
        );
      }
    };

  const resetWizard =
    async () => {
      await clearDraft();

      setIdentity(
        initialIdentity,
      );

      setAnswers(
        initialAnswers,
      );

      setSelectedPlan(
        "free",
      );

      setSelectedTone(
        "professional",
      );

      setRewriteIndex(
        0,
      );

      setGeneratedContent(
        emptyGeneratedContent,
      );

      setLogoFile(
        null,
      );

      setLogoPreview(
        null,
      );

      setSlugTouched(
        false,
      );

      setCurrentStepIndex(
        0,
      );
    };
      const renderIdentity =
    () => (
      <div>
        <StepHeading
          eyebrow="Business details"
          title="Start with the basics"
          description="Tell Storvo who you are. We will use this information to shape your website."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-foreground">
              Business name
            </label>

            <input
              value={
                identity.name
              }
              onChange={(
                event,
              ) =>
                updateIdentity(
                  "name",
                  event.target
                    .value,
                )
              }
              placeholder="e.g. Plum n Peaches Events"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-foreground">
              Website address
            </label>

            <div className="mt-2 flex h-12 overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <span className="flex items-center border-r border-border bg-muted px-3 text-xs text-muted-foreground">
                storvo.app/
              </span>

              <input
                value={
                  identity.slug
                }
                onChange={(
                  event,
                ) => {
                  setSlugTouched(
                    true,
                  );

                  updateIdentity(
                    "slug",
                    generateSlug(
                      event.target
                        .value,
                    ),
                  );
                }}
                placeholder="your-business"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground">
              WhatsApp number
            </label>

            <input
              value={
                identity.whatsappNumber
              }
              onChange={(
                event,
              ) =>
                updateIdentity(
                  "whatsappNumber",
                  event.target
                    .value,
                )
              }
              placeholder="+234..."
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-foreground">
              Instagram handle
            </label>

            <input
              value={
                identity.instagramHandle
              }
              onChange={(
                event,
              ) =>
                updateIdentity(
                  "instagramHandle",
                  event.target
                    .value,
                )
              }
              placeholder="@yourbusiness"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-bold text-foreground">
              Service area or location
            </label>

            <input
              value={
                identity.serviceArea
              }
              onChange={(
                event,
              ) =>
                updateIdentity(
                  "serviceArea",
                  event.target
                    .value,
                )
              }
              placeholder="e.g. Lagos, Nigeria or London and surrounding areas"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Optional. Useful for service businesses and businesses serving specific locations.
            </p>
          </div>
        </div>
      </div>
    );

  const renderBusinessModel =
    () => (
      <div>
        <StepHeading
          eyebrow="Business type"
          title="What kind of business are you building?"
          description="Choose the option that best describes how customers buy from or engage with your business."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {businessModels.map(
            (model) => (
              <SelectionCard
                key={
                  model.value
                }
                selected={
                  answers.businessModel ===
                  model.value
                }
                title={
                  model.title
                }
                description={
                  model.description
                }
                icon={
                  model.icon
                }
                onClick={() => {
                  const firstCategory =
                    categoryOptions[
                      model.value
                    ][0]
                      ?.value ||
                    "";

                  setAnswers(
                    (current) => ({
                      ...current,
                      businessModel:
                        model.value,
                      category:
                        firstCategory,
                      primaryAction:
                        actionOptions[
                          model.value
                        ][0] ||
                        "",
                      secondaryAction:
                        actionOptions[
                          model.value
                        ][1] ||
                        actionOptions[
                          model.value
                        ][0] ||
                        "",
                    }),
                  );
                }}
              />
            ),
          )}
        </div>
      </div>
    );

  const renderCategory =
    () => (
      <div>
        <StepHeading
          eyebrow="Business category"
          title="Choose the closest category"
          description="This helps Storvo understand the language, structure and content your website should use."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {currentCategoryOptions.map(
            (category) => (
              <SelectionCard
                key={
                  category.value
                }
                selected={
                  answers.category ===
                  category.value
                }
                title={
                  category.label
                }
                description={
                  category.description
                }
                onClick={() =>
                  updateAnswer(
                    "category",
                    category.value,
                  )
                }
              />
            ),
          )}
        </div>
      </div>
    );

  const renderOffering =
    () => {
      const isService =
        answers.businessModel ===
        "service";

      const isDigital =
        answers.businessModel ===
        "digital";

      return (
        <div>
          <StepHeading
            eyebrow="Your offer"
            title={
              isService
                ? "What services do you offer?"
                : isDigital
                  ? "What digital products do you offer?"
                  : "What products do you sell?"
            }
            description={
              isService
                ? "List the main services customers can enquire about or book. You can separate them with commas or put each one on a new line."
                : isDigital
                  ? "List the digital products, resources or learning materials customers can access."
                  : "Describe the main products or product categories customers will find in your store."
            }
          />

          <textarea
            value={
              answers.offering
            }
            onChange={(
              event,
            ) =>
              updateAnswer(
                "offering",
                event.target
                  .value,
              )
            }
            placeholder={
              isService
                ? "e.g. Event planning, event coordination, wedding planning, décor and venue sourcing"
                : isDigital
                  ? "e.g. E-books, business templates, recorded courses and downloadable guides"
                  : "e.g. Women's clothing, handbags, footwear and accessories"
            }
            rows={8}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />

          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-bold text-foreground">
              Selected category
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {getCategoryLabel(
                answers.businessModel,
                answers.category,
              )}
            </p>
          </div>
        </div>
      );
    };

  const renderAudience =
    () => (
      <div>
        <StepHeading
          eyebrow="Ideal customer"
          title="Who do you want to attract?"
          description="Describe the people, families, organisations or customers your business is mainly for."
        />

        <textarea
          value={
            answers.targetAudience
          }
          onChange={(
            event,
          ) =>
            updateAnswer(
              "targetAudience",
              event.target
                .value,
            )
          }
          placeholder={
            answers.businessModel ===
            "service"
              ? "e.g. Busy families, working professionals and organisations looking for dependable support"
              : answers.businessModel ===
                  "digital"
                ? "e.g. Small business owners and professionals who want practical resources they can use immediately"
                : "e.g. Women aged 25 to 45 who want stylish, affordable everyday fashion"
          }
          rows={7}
          className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>
    );

  const renderDifference =
    () => (
      <div>
        <StepHeading
          eyebrow="Why you?"
          title="What should customers remember about your business?"
          description="Tell us what makes your business worth choosing. This becomes part of your positioning and website copy."
        />

        <textarea
          value={
            answers.uniqueSellingPoint
          }
          onChange={(
            event,
          ) =>
            updateAnswer(
              "uniqueSellingPoint",
              event.target
                .value,
            )
          }
          placeholder="e.g. We combine personal service, fast response and close attention to detail."
          rows={6}
          className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />

        <div className="mt-5">
          <p className="text-sm font-bold text-foreground">
            Need inspiration?
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {differenceSuggestions[
              answers.businessModel
            ].map(
              (
                suggestion,
              ) => (
                <button
                  key={
                    suggestion
                  }
                  type="button"
                  onClick={() =>
                    updateAnswer(
                      "uniqueSellingPoint",
                      suggestion,
                    )
                  }
                  className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  {suggestion}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    );
      const renderAction =
    () => (
      <div>
        <StepHeading
          eyebrow="Customer action"
          title="What should customers do first?"
          description="Choose the main call to action for your website, then a secondary action if needed."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-foreground">
              Primary action
            </label>

            <select
              value={
                answers.primaryAction
              }
              onChange={(
                event,
              ) =>
                updateAnswer(
                  "primaryAction",
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {currentActionOptions.map(
                (option) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-foreground">
              Secondary action
            </label>

            <select
              value={
                answers.secondaryAction
              }
              onChange={(
                event,
              ) =>
                updateAnswer(
                  "secondaryAction",
                  event.target.value,
                )
              }
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {currentActionOptions.map(
                (option) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>
    );

  const renderBranding =
    () => (
      <div>
        <StepHeading
          eyebrow="Branding"
          title="Give your website your own look"
          description="Upload your logo, choose a visual style and adjust your colours. Storvo can detect colours from your logo automatically."
        />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-bold text-foreground">
                Business logo
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                PNG or JPG works best. Large files are reduced automatically.
              </p>

              {logoPreview ? (
                <div className="mt-5">
                  <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-5">
                    <img
                      src={
                        logoPreview
                      }
                      alt="Business logo preview"
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition hover:bg-accent"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void removeLogo()
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center transition hover:border-primary/50 hover:bg-primary/5"
                >
                  <Upload className="h-7 w-7 text-primary" />

                  <p className="mt-3 text-sm font-bold text-foreground">
                    Upload your logo
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    We can use it to suggest your brand colours.
                  </p>
                </button>
              )}

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(
                  event,
                ) => {
                  const file =
                    event.target
                      .files?.[0] ||
                    null;

                  void handleLogoChange(
                    file,
                  );

                  event.target.value =
                    "";
                }}
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-bold text-foreground">
                Brand colours
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Primary
                  </span>

                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={
                        answers.primaryColor
                      }
                      onChange={(
                        event,
                      ) =>
                        updateAnswer(
                          "primaryColor",
                          event.target.value,
                        )
                      }
                      className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                    />

                    <input
                      value={
                        answers.primaryColor
                      }
                      onChange={(
                        event,
                      ) =>
                        updateAnswer(
                          "primaryColor",
                          event.target.value,
                        )
                      }
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Accent
                  </span>

                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={
                        answers.accentColor
                      }
                      onChange={(
                        event,
                      ) =>
                        updateAnswer(
                          "accentColor",
                          event.target.value,
                        )
                      }
                      className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                    />

                    <input
                      value={
                        answers.accentColor
                      }
                      onChange={(
                        event,
                      ) =>
                        updateAnswer(
                          "accentColor",
                          event.target.value,
                        )
                      }
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-foreground">
              Website style
            </p>

            <div className="mt-3 grid gap-3">
              {brandStyles.map(
                (style) => (
                  <button
                    key={
                      style.value
                    }
                    type="button"
                    onClick={() => {
                      updateAnswer(
                        "brandStyle",
                        style.value,
                      );

                      setSelectedTone(
                        style.tone,
                      );
                    }}
                    className={`border p-5 text-left transition ${style.className} ${
                      answers.brandStyle ===
                      style.value
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">
                          {style.label}
                        </p>

                        <p className="mt-2 text-sm leading-6 opacity-75">
                          {style.description}
                        </p>
                      </div>

                      {answers.brandStyle ===
                      style.value ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                      ) : null}
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );

  const renderPreview =
    () => (
      <div>
        <StepHeading
          eyebrow="Website preview"
          title="Storvo has written your website"
          description="Review the wording below. You can change the writing tone, generate a different version or go back and change your answers."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div
              className="border-b border-border px-6 py-7 sm:px-8"
              style={{
                background: `linear-gradient(135deg, ${answers.primaryColor}18, ${answers.accentColor}12)`,
              }}
            >
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={
                      logoPreview
                    }
                    alt=""
                    className="h-12 w-12 rounded-xl object-contain"
                  />
                ) : (
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{
                      backgroundColor:
                        answers.primaryColor,
                    }}
                  >
                    <Store className="h-6 w-6" />
                  </span>
                )}

                <div>
                  <p className="font-black text-foreground">
                    {identity.name ||
                      "Your business"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    storvo.app/
                    {identity.slug ||
                      "your-business"}
                  </p>
                </div>
              </div>

              <p
                className="mt-8 text-xs font-black uppercase tracking-[0.16em]"
                style={{
                  color:
                    answers.primaryColor,
                }}
              >
                {previewContent.featuredLabel ||
                  "Your business"}
              </p>

              <h3 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                {previewContent.headline ||
                  "Your website headline will appear here."}
              </h3>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                {previewContent.introduction ||
                  "Complete the earlier questions and Storvo will create tailored website wording."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span
                  className="rounded-xl px-4 py-3 text-sm font-bold text-white"
                  style={{
                    backgroundColor:
                      answers.primaryColor,
                  }}
                >
                  {answers.primaryAction ||
                    "Get started"}
                </span>

                <span className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
                  {answers.secondaryAction ||
                    "Learn more"}
                </span>
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              <section>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
                  {previewContent.aboutTitle}
                </p>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {previewContent.aboutText}
                </p>
              </section>

              <section>
                <h4 className="text-xl font-black text-foreground">
                  {previewContent.sectionTitle}
                </h4>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {previewContent.sectionSubtitle}
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {previewContent.services.map(
                    (service) => (
                      <div
                        key={
                          service.id
                        }
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <p className="font-bold text-foreground">
                          {service.title}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Sparkles className="h-6 w-6 text-primary" />

              <h3 className="mt-4 font-bold text-foreground">
                Created automatically
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Storvo interpreted your business answers and created tailored website wording.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-bold text-foreground">
                Writing tone
              </p>

              <div className="mt-3 grid gap-2">
                {(
                  [
                    "professional",
                    "warm",
                    "premium",
                    "bold",
                    "friendly",
                  ] as ContentTone[]
                ).map(
                  (tone) => (
                    <button
                      key={
                        tone
                      }
                      type="button"
                      onClick={() => {
                        setSelectedTone(
                          tone,
                        );

                        setRewriteIndex(
                          0,
                        );
                      }}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold capitalize transition ${
                        selectedTone ===
                        tone
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {tone}
                    </button>
                  ),
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={
                rewritePreviewContent
              }
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition hover:bg-accent"
            >
              Rewrite the wording
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentStepIndex(
                  steps.indexOf(
                    "offering",
                  ),
                )
              }
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition hover:bg-accent"
            >
              Change my answers
            </button>
          </div>
        </div>
      </div>
    );
      const renderPlan =
    () => (
      <div>
        <StepHeading
          eyebrow="Choose a plan"
          title="Your website is ready to launch"
          description="Choose how to begin. Your business information, branding and generated website content are already prepared."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <PlanCard
            selected={
              selectedPlan ===
              "free"
            }
            title="Free"
            price="₦0"
            priceSuffix="/forever"
            description="A simple way to get your business online."
            features={[
              "Up to 10 products, services or listings",
              "Up to 3 images per product",
              "Up to 6 gallery images",
              "Automatic website wording",
              "Customer enquiries",
              "Storvo branding",
              "1% transaction fee",
            ]}
            onClick={() =>
              setSelectedPlan(
                "free",
              )
            }
          />

          <PlanCard
            selected={
              selectedPlan ===
              "pro"
            }
            title="Pro"
            price="₦3,500"
            priceSuffix="/month"
            description="More capacity, stronger branding and advanced business tools."
            features={[
              "Up to 500 products, services or listings",
              "Up to 10 images per product",
              "Up to 4 product videos",
              "Up to 30 gallery images",
              "Custom domain support",
              "Remove Storvo branding",
              "Advanced analytics",
              "Advanced SEO",
              "Discount codes",
              "0% transaction fee",
            ]}
            onClick={() =>
              setSelectedPlan(
                "pro",
              )
            }
            recommended
          />
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              goBack
            }
            disabled={
              saving ||
              uploadingLogo
            }
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-bold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-44"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <button
            type="button"
            onClick={
              finishSetup
            }
            disabled={
              saving ||
              uploadingLogo
            }
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ||
            uploadingLogo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Rocket className="h-5 w-5" />
            )}

            {saving
              ? "Launching your website..."
              : selectedPlan ===
                  "free"
                ? "Start Free"
                : "Go Pro"}
          </button>
        </div>
      </div>
    );

  const renderComplete =
    () => (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-10 w-10" />
        </span>

        <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-primary">
          Website launched
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          {identity.name} is ready.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Storvo created and saved your business website using the information, branding and content you approved.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              const slug =
                generateSlug(
                  identity.slug,
                );

              if (!slug) {
                return;
              }

              window.open(
                `/${slug}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-95"
          >
            <Monitor className="h-5 w-5" />
            View website
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard",
              )
            }
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-bold text-foreground transition hover:bg-accent"
          >
            Go to dashboard
          </button>
        </div>

        {!isEditMode ? (
          <button
            type="button"
            onClick={() =>
              void resetWizard()
            }
            className="mt-5 text-sm font-bold text-primary transition hover:opacity-80"
          >
            Set up another business
          </button>
        ) : null}
      </div>
    );

  const renderCurrentStep =
    () => {
      switch (
        currentStep
      ) {
        case "identity":
          return renderIdentity();

        case "business-model":
          return renderBusinessModel();

        case "category":
          return renderCategory();

        case "offering":
          return renderOffering();

        case "audience":
          return renderAudience();

        case "difference":
          return renderDifference();

        case "action":
          return renderAction();

        case "branding":
          return renderBranding();

        case "preview":
          return renderPreview();

        case "plan":
          return renderPlan();

        case "complete":
          return renderComplete();

        default:
          return null;
      }
    };
    if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />

          <p className="mt-3 text-sm text-muted-foreground">
            Loading your business setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={saving || uploadingLogo}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm font-black text-foreground">
                {isEditMode
                  ? "Edit business website"
                  : "Build your business website"}
              </p>

              <p className="text-xs text-muted-foreground">
                Storvo setup
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-xs font-semibold text-muted-foreground">
              {progress}% complete
            </span>

            <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {currentStep !== "complete" ? (
          <div className="mb-7 sm:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length - 1}
              </span>

              <span className="text-xs font-semibold text-muted-foreground">
                {progress}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-border bg-background p-5 shadow-sm sm:p-7 lg:p-10">
          {renderCurrentStep()}
        </div>

        {currentStep !== "complete" && currentStep !== "plan" ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={saving || uploadingLogo}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={saving || uploadingLogo}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default StoreSetupWizard;  