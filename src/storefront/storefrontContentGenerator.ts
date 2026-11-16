export type BusinessModel =
  | "product"
  | "service"
  | "digital";

export type ContentTone =
  | "professional"
  | "warm"
  | "premium"
  | "bold"
  | "friendly";

export type ServiceCard = {
  id: string;
  title: string;
  description: string;
};

export type ProcessStep = {
  title: string;
  description: string;
};

export type GeneratedContent = {
  shortDescription: string;
  headline: string;
  introduction: string;
  aboutTitle: string;
  aboutText: string;
  sectionTitle: string;
  sectionSubtitle: string;
  featuredLabel: string;
  featuredText: string;
  services: ServiceCard[];
  trustPoints: string[];
  processSteps: ProcessStep[];
  reasons: string[];
};

export type GeneratorInput = {
  businessName: string;
  businessModel: BusinessModel;
  category: string;
  offering: string;
  targetAudience: string;
  uniqueSellingPoint: string;
  serviceArea?: string;
  tone?: ContentTone;
  rewriteIndex?: number;
};

type CategoryCopy = {
  headline: Record<
    ContentTone,
    string[]
  >;
  sectionTitle: string;
  sectionSubtitle: string;
  eyebrow: string;
};

const EVENT_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Exceptional events, professionally planned.",
      "Thoughtful planning for remarkable occasions.",
      "Professional event planning from concept to completion.",
    ],

    warm: [
      "Beautiful moments, thoughtfully brought to life.",
      "Celebrations designed around what matters most.",
      "Meaningful occasions, planned with care.",
    ],

    premium: [
      "Luxury events, thoughtfully planned and flawlessly delivered.",
      "Refined celebrations. Impeccable execution.",
      "Elegant experiences created to the highest standard.",
    ],

    bold: [
      "Unforgettable events start with a powerful vision.",
      "Big ideas. Beautiful spaces. Flawless execution.",
      "Events designed to make a lasting impression.",
    ],

    friendly: [
      "Let us make your special event feel effortless.",
      "Creative planning for celebrations you will always remember.",
      "Your occasion, beautifully planned from start to finish.",
    ],
  },

  sectionTitle: "Our event services",

  sectionSubtitle:
    "From first concept to flawless event-day delivery.",

  eyebrow: "Luxury event planning",
};

const CARE_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Reliable care and staffing support for every household.",
      "Professional care and domestic staffing made simpler.",
      "Trusted support matched carefully to your needs.",
    ],

    warm: [
      "Dependable support for the people who matter most.",
      "Care, comfort and trusted help for every home.",
      "Helping families find the right support with confidence.",
    ],

    premium: [
      "Trusted care, selected with exceptional attention.",
      "Professional household support, carefully matched.",
      "A considered approach to care and staffing.",
    ],

    bold: [
      "The right support changes everything.",
      "Trusted people. Safer homes. Stronger families.",
      "Professional care without the uncertainty.",
    ],

    friendly: [
      "Finding dependable support should feel simple.",
      "Helping your family find the right person.",
      "Reliable support, clear guidance and genuine care.",
    ],
  },

  sectionTitle: "Our services",

  sectionSubtitle:
    "Explore the available care, staffing and household support services.",

  eyebrow: "Care and staffing support",
};

const CLEANING_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Professional cleaning for healthier, better-managed spaces.",
      "Reliable cleaning tailored to your property.",
      "A cleaner space, delivered professionally.",
    ],

    warm: [
      "A cleaner home and more time for what matters.",
      "Fresh, comfortable spaces without the stress.",
      "Helping your space feel clean, calm and welcoming.",
    ],

    premium: [
      "Immaculate spaces, professionally maintained.",
      "Exceptional cleaning with attention to every detail.",
      "Premium care for beautifully maintained spaces.",
    ],

    bold: [
      "Deep cleaning. Visible results.",
      "Serious cleaning for spaces that need real attention.",
      "Cleaner spaces start here.",
    ],

    friendly: [
      "Let us take the cleaning off your hands.",
      "A simple way to enjoy a cleaner space.",
      "Reliable cleaning whenever your space needs it.",
    ],
  },

  sectionTitle: "Our cleaning services",

  sectionSubtitle:
    "Choose the cleaning support that best suits your home, property or workplace.",

  eyebrow: "Professional cleaning",
};

const CONSULTING_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Expert guidance for better business decisions.",
      "Clear strategy and practical professional support.",
      "Professional insight focused on meaningful results.",
    ],

    warm: [
      "Practical guidance for your next important step.",
      "Helping you move forward with greater clarity.",
      "Supportive expertise built around your goals.",
    ],

    premium: [
      "Strategic insight for ambitious organisations.",
      "Expert advisory services for considered growth.",
      "High-level guidance for important decisions.",
    ],

    bold: [
      "Turn challenges into clear action.",
      "Sharper strategy. Stronger decisions. Better outcomes.",
      "Move from uncertainty to momentum.",
    ],

    friendly: [
      "Straightforward advice you can actually use.",
      "Professional guidance without the unnecessary complexity.",
      "Let us help you find the clearest way forward.",
    ],
  },

  sectionTitle: "Our consulting services",

  sectionSubtitle:
    "Explore the advisory and professional support available for your goals and challenges.",

  eyebrow: "Professional consulting",
};

const EDUCATION_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Practical learning designed for real progress.",
      "Professional training that builds confidence and capability.",
      "Clear instruction for stronger knowledge and performance.",
    ],

    warm: [
      "Learning support that meets you where you are.",
      "Helping every learner move forward with confidence.",
      "Clear, supportive learning for meaningful progress.",
    ],

    premium: [
      "Expert-led learning for ambitious professionals.",
      "Advanced training designed for measurable development.",
      "A refined learning experience built around excellence.",
    ],

    bold: [
      "Learn faster. Apply more. Achieve better.",
      "Build the skills that move you forward.",
      "Knowledge becomes powerful when you can use it.",
    ],

    friendly: [
      "Learning made clearer, simpler and more practical.",
      "Build new skills without feeling overwhelmed.",
      "Supportive training for your next level.",
    ],
  },

  sectionTitle: "Our training services",

  sectionSubtitle:
    "Explore practical learning, coaching and development support.",

  eyebrow: "Professional training",
};
const GENERIC_SERVICE_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Professional services built around your needs.",
      "Reliable support for important goals and everyday challenges.",
      "Practical professional services focused on strong outcomes.",
    ],

    warm: [
      "Helpful support, thoughtfully delivered.",
      "Professional services with a personal approach.",
      "Support designed around what matters to you.",
    ],

    premium: [
      "Refined professional support for discerning clients.",
      "Expert service delivered with exceptional attention.",
      "A higher standard of professional support.",
    ],

    bold: [
      "Get the right support and move forward.",
      "Professional help that gets things done.",
      "Clear support. Strong delivery. Real results.",
    ],

    friendly: [
      "Professional help made simple.",
      "The support you need, without the hassle.",
      "Friendly, dependable service when you need it.",
    ],
  },

  sectionTitle: "Our services",

  sectionSubtitle:
    "Explore the professional support available to help you move forward.",

  eyebrow: "Professional services",
};

const PRODUCT_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Quality products selected for everyday needs.",
      "Products you can shop with confidence.",
      "A straightforward way to discover and order quality products.",
    ],

    warm: [
      "Products chosen to make everyday life a little better.",
      "Find something you will love.",
      "Thoughtfully selected products for you.",
    ],

    premium: [
      "A refined collection of carefully selected products.",
      "Distinctive products, thoughtfully presented.",
      "Quality products for customers who value the details.",
    ],

    bold: [
      "Discover products worth talking about.",
      "Standout products. Easy ordering.",
      "Find your next favourite product.",
    ],

    friendly: [
      "Great products, easy shopping.",
      "Take a look around and find something you love.",
      "Simple shopping for products you will enjoy.",
    ],
  },

  sectionTitle: "Shop the collection",

  sectionSubtitle:
    "Browse available products and find what suits you.",

  eyebrow: "Shop online",
};

const DIGITAL_CATEGORY_COPY: CategoryCopy = {
  headline: {
    professional: [
      "Digital resources designed to help you move forward.",
      "Practical digital products available whenever you need them.",
      "Useful digital tools, resources and learning made accessible.",
    ],

    warm: [
      "Helpful digital resources for your next step.",
      "Learn, create and grow with practical digital products.",
      "Useful resources you can access wherever you are.",
    ],

    premium: [
      "Premium digital resources for ambitious customers.",
      "Expertly created digital products for meaningful progress.",
      "High-quality digital resources built for better results.",
    ],

    bold: [
      "Download. Learn. Create. Move forward.",
      "Digital products built to help you do more.",
      "Get the resources you need and start now.",
    ],

    friendly: [
      "Useful digital products, ready when you are.",
      "Simple resources to help you learn, create and grow.",
      "Download what you need and get started.",
    ],
  },

  sectionTitle: "Digital products",

  sectionSubtitle:
    "Browse downloadable resources, learning and digital tools.",

  eyebrow: "Instant digital access",
};

const EVENT_SERVICE_ALIASES = [
  {
    phrases: [
      "event planning",
      "event planner",
      "full event planning",
      "planning",
    ],
    title: "Event Planning",
    description:
      "Complete planning support from early ideas and budgets to suppliers, schedules and final delivery.",
  },
  {
    phrases: [
      "event coordination",
      "event co-ordination",
      "day coordination",
      "day-of coordination",
      "on the day coordination",
      "coordination",
    ],
    title: "Event Coordination",
    description:
      "Professional coordination that keeps suppliers, timings and event-day details running smoothly.",
  },
  {
    phrases: [
      "decor",
      "décor",
      "decoration",
      "styling",
      "event styling",
    ],
    title: "Event Styling and Décor",
    description:
      "Creative styling and décor designed around your theme, venue and overall event vision.",
  },
  {
    phrases: [
      "wedding planning",
      "weddings",
      "wedding",
    ],
    title: "Wedding Planning",
    description:
      "Thoughtful wedding planning and coordination tailored around your priorities, guests and celebration.",
  },
  {
    phrases: [
      "corporate event",
      "corporate events",
      "business event",
      "business events",
    ],
    title: "Corporate Events",
    description:
      "Professional planning and coordination for business events, launches, conferences and corporate occasions.",
  },
  {
    phrases: [
      "birthday",
      "birthdays",
      "party",
      "parties",
      "celebration",
      "celebrations",
    ],
    title: "Private Celebrations",
    description:
      "Creative planning and coordination for birthdays, anniversaries and other private celebrations.",
  },
  {
    phrases: [
      "venue sourcing",
      "venue search",
      "venue finding",
      "find venue",
    ],
    title: "Venue Sourcing",
    description:
      "Support finding suitable venues based on your event style, guest numbers, location and budget.",
  },
  {
    phrases: [
      "vendor sourcing",
      "supplier sourcing",
      "vendor management",
      "supplier management",
    ],
    title: "Supplier Management",
    description:
      "Help sourcing, briefing and coordinating trusted suppliers for a smoother event experience.",
  },
];

const CARE_SERVICE_ALIASES = [
  {
    phrases: [
      "caregiver",
      "caregivers",
      "care giver",
      "care givers",
      "home care",
      "domiciliary care",
    ],
    title: "Caregiver Support",
    description:
      "Carefully matched caregivers providing dependable support based on the individual or family’s needs.",
  },
  {
    phrases: [
      "domestic staff",
      "domestic staffing",
      "house help",
      "househelp",
      "housekeeper",
      "housekeepers",
      "housekeeping staff",
    ],
    title: "Domestic Staffing",
    description:
      "Reliable domestic staff matched to household requirements, routines and expectations.",
  },
  {
    phrases: [
      "nanny",
      "nannies",
      "childcare",
      "child care",
    ],
    title: "Nanny and Childcare Support",
    description:
      "Dependable childcare support matched carefully to the family’s schedule and requirements.",
  },
  {
    phrases: [
      "elderly care",
      "elder care",
      "senior care",
      "aged care",
    ],
    title: "Elderly Care Support",
    description:
      "Practical and compassionate support designed around the needs, comfort and independence of older adults.",
  },
  {
    phrases: [
      "recruitment",
      "staff recruitment",
      "staff placement",
      "placement",
    ],
    title: "Staff Recruitment and Placement",
    description:
      "Structured recruitment and placement support to help families and organisations find suitable staff.",
  },
  {
    phrases: [
      "live in care",
      "live-in care",
      "live in caregiver",
      "live-in caregiver",
    ],
    title: "Live-in Care",
    description:
      "Continuous in-home support for individuals who need dependable assistance throughout the day and night.",
  },
];

const CLEANING_SERVICE_ALIASES = [
  {
    phrases: [
      "regular cleaning",
      "routine cleaning",
      "house cleaning",
      "home cleaning",
      "domestic cleaning",
    ],
    title: "Regular Cleaning",
    description:
      "Reliable routine cleaning to help keep homes and living spaces fresh, tidy and well maintained.",
  },
  {
    phrases: [
      "deep cleaning",
      "deep clean",
    ],
    title: "Deep Cleaning",
    description:
      "Detailed top-to-bottom cleaning for spaces that need extra attention beyond routine maintenance.",
  },
  {
    phrases: [
      "end of tenancy",
      "end-of-tenancy",
      "move out cleaning",
      "move-out cleaning",
      "move in cleaning",
      "move-in cleaning",
    ],
    title: "End of Tenancy Cleaning",
    description:
      "Thorough cleaning for move-ins, move-outs and tenancy handovers, with close attention to presentation.",
  },
  {
    phrases: [
      "office cleaning",
      "commercial cleaning",
      "business cleaning",
    ],
    title: "Commercial Cleaning",
    description:
      "Professional cleaning for offices, workplaces and commercial environments on a schedule that suits the business.",
  },
  {
    phrases: [
      "after builders",
      "after-builders",
      "post construction",
      "post-construction",
      "builders clean",
    ],
    title: "After Builders Cleaning",
    description:
      "Detailed post-construction cleaning to remove dust, debris and residue before the space is ready for use.",
  },
  {
    phrases: [
      "airbnb cleaning",
      "short let cleaning",
      "short-let cleaning",
      "holiday let cleaning",
    ],
    title: "Short-let Cleaning",
    description:
      "Efficient turnaround cleaning for short-let and holiday properties between guest stays.",
  },
];

const EVENT_PROMOTIONAL_PHRASES = [
  "creating unforgettable experiences",
  "making memories",
  "bringing your vision to life",
  "turning dreams into reality",
  "creating memorable moments",
  "making your day special",
];

const createId = (
  value: string,
  index: number,
) =>
  `${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${index}`;

const normaliseSentence = (
  value: string,
) => {
  const trimmed = value
    .replace(/\s+/g, " ")
    .trim();

  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed)
    ? trimmed
    : `${trimmed}.`;
};

const shorten = (
  value: string,
  maxLength: number,
) => {
  const clean = value
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const shortened = clean
    .slice(0, maxLength)
    .replace(/\s+\S*$/, "")
    .replace(/[,\s]+$/, "");

  return `${shortened}…`;
};
const splitRawOffering = (
  offering: string,
) =>
  offering
    .split(
      /\n|,|;|\/|\||\u2022|(?:\s+-\s+)/g,
    )
    .map((item) =>
      item
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

const removePromotionalFragments = (
  value: string,
  category: string,
) => {
  let cleaned = value;

  const expressions = [
    /\bcreating unforgettable experiences\b/gi,
    /\bbringing your vision to life\b/gi,
    /\bmaking memories\b/gi,
    /\bturning dreams into reality\b/gi,
    /\bcreating memorable moments\b/gi,
    /\bmaking your day special\b/gi,
    /\bwith passion and excellence\b/gi,
    /\bwith quality and care\b/gi,
    /\bwith professionalism\b/gi,
  ];

  if (category === "events") {
    EVENT_PROMOTIONAL_PHRASES.forEach(
      (phrase) => {
        cleaned = cleaned.replace(
          new RegExp(phrase, "gi"),
          " ",
        );
      },
    );
  }

  expressions.forEach(
    (expression) => {
      cleaned = cleaned.replace(
        expression,
        " ",
      );
    },
  );

  cleaned = cleaned
    .replace(
      /\b(and|with|that|which|while|through)\s*$/i,
      "",
    )
    .replace(
      /^[\s,&.-]+|[\s,&.-]+$/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
};

const findAliasServices = (
  offering: string,
  aliases: Array<{
    phrases: string[];
    title: string;
    description: string;
  }>,
) => {
  const source =
    offering.toLowerCase();

  const matches: ServiceCard[] =
    [];

  aliases.forEach(
    (alias, index) => {
      if (
        alias.phrases.some(
          (phrase) =>
            source.includes(
              phrase.toLowerCase(),
            ),
        )
      ) {
        matches.push({
          id: createId(
            alias.title,
            index,
          ),
          title:
            alias.title,
          description:
            alias.description,
        });
      }
    },
  );

  return matches;
};

const titleCase = (
  value: string,
) =>
  value
    .toLowerCase()
    .replace(
      /\b[a-z]/g,
      (character) =>
        character.toUpperCase(),
    );

const createGenericServiceDescription = (
  title: string,
  category: string,
) => {
  switch (category) {
    case "events":
      return "Event support tailored around your occasion and vision.";

    case "cleaning":
      return "Professional cleaning tailored to the property, required standard and preferred schedule.";

    case "consulting":
    case "professional-services":
      return "Professional guidance tailored around the client’s goals, challenges and desired outcome.";

    case "education-training":
      return "Clear and practical learning support designed around the learner’s needs and objectives.";

    case "beauty-services":
      return "Professional beauty support tailored around the client’s preferred look and occasion.";

    case "property-services":
      return "Dependable property support tailored around the client’s requirements and location.";

    case "repairs":
      return "Reliable repair and maintenance support based on the issue, property and required outcome.";

    default:
      return "Professional support tailored around each customer’s specific requirements.";
  }
};

const deduplicateServices = (
  services: ServiceCard[],
) => {
  const seen =
    new Set<string>();

  return services.filter(
    (service) => {
      const key =
        service.title
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            "",
          );

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    },
  );
};

export const extractStructuredServices = (
  offering: string,
  category: string,
): ServiceCard[] => {
  let aliasMatches:
    ServiceCard[] = [];

  if (
    category === "events"
  ) {
    aliasMatches =
      findAliasServices(
        offering,
        EVENT_SERVICE_ALIASES,
      );
  } else if (
    category ===
    "care-staffing"
  ) {
    aliasMatches =
      findAliasServices(
        offering,
        CARE_SERVICE_ALIASES,
      );
  } else if (
    category === "cleaning"
  ) {
    aliasMatches =
      findAliasServices(
        offering,
        CLEANING_SERVICE_ALIASES,
      );
  }

  const rawItems =
    splitRawOffering(
      offering,
    );

  const genericItems =
    rawItems
      .map((item) =>
        removePromotionalFragments(
          item,
          category,
        ),
      )
      .filter(
        (item) =>
          item.length >= 3 &&
          item.length <= 70,
      )
      .filter((item) => {
        const lower =
          item.toLowerCase();

        if (
          category ===
            "events" &&
          EVENT_PROMOTIONAL_PHRASES.some(
            (phrase) =>
              lower === phrase ||
              lower.startsWith(
                `${phrase} `,
              ),
          )
        ) {
          return false;
        }

        return true;
      })
      .map(
        (
          item,
          index,
        ): ServiceCard => ({
          id: createId(
            item,
            index +
              aliasMatches.length,
          ),
          title:
            titleCase(item),
          description:
            createGenericServiceDescription(
              item,
              category,
            ),
        }),
      );

  return deduplicateServices([
    ...aliasMatches,
    ...genericItems,
  ]).slice(0, 6);
};

const getCategoryCopy = (
  businessModel: BusinessModel,
  category: string,
) => {
  if (
    businessModel === "product"
  ) {
    return PRODUCT_CATEGORY_COPY;
  }

  if (
    businessModel === "digital"
  ) {
    return DIGITAL_CATEGORY_COPY;
  }

  switch (category) {
    case "events":
      return EVENT_CATEGORY_COPY;

    case "care-staffing":
      return CARE_CATEGORY_COPY;

    case "cleaning":
      return CLEANING_CATEGORY_COPY;

    case "consulting":
    case "professional-services":
      return CONSULTING_CATEGORY_COPY;

    case "education-training":
      return EDUCATION_CATEGORY_COPY;

    default:
      return GENERIC_SERVICE_COPY;
  }
};

const pickVariant = (
  values: string[],
  rewriteIndex = 0,
) =>
  values[
    Math.abs(rewriteIndex) %
      values.length
  ];

const getAudiencePhrase = (
  targetAudience: string,
) => {
  const clean =
    targetAudience
      .replace(/\s+/g, " ")
      .trim();

  if (!clean) {
    return "";
  }

  return clean
    .replace(
      /^(for|serving|helping)\s+/i,
      "",
    )
    .replace(/[.!?]+$/, "");
};

const getAreaPhrase = (
  serviceArea?: string,
) => {
  const clean =
    serviceArea
      ?.replace(/\s+/g, " ")
      .trim() || "";

  if (!clean) {
    return "";
  }

  return clean.replace(
    /^(in|across|around|serving)\s+/i,
    "",
  );
};

const createShortDescription = (
  input: GeneratorInput,
) => {
  const {
    businessName,
    businessModel,
    offering,
    targetAudience,
    serviceArea,
  } = input;

  const audience =
    getAudiencePhrase(
      targetAudience,
    );

  const area =
    getAreaPhrase(
      serviceArea,
    );

  if (
    businessModel === "service"
  ) {
    const pieces = [
      businessName,
      offering,
      audience
        ? `for ${audience}`
        : "",
      area
        ? `in ${area}`
        : "",
    ].filter(Boolean);

    return shorten(
      normaliseSentence(
        pieces.join(" "),
      ),
      180,
    );
  }

  if (
    businessModel === "digital"
  ) {
    return shorten(
      normaliseSentence(
        `${businessName} offers ${offering}${
          audience
            ? ` for ${audience}`
            : ""
        }`,
      ),
      180,
    );
  }

  return shorten(
    normaliseSentence(
      `${businessName} offers ${offering}${
        audience
          ? ` for ${audience}`
          : ""
      }`,
    ),
    180,
  );
};
const createIntroduction = (
  input: GeneratorInput,
  categoryCopy: CategoryCopy,
) => {
  const {
    businessName,
    businessModel,
    offering,
    targetAudience,
    uniqueSellingPoint,
    serviceArea,
  } = input;

  const audience =
    getAudiencePhrase(
      targetAudience,
    );

  const area =
    getAreaPhrase(
      serviceArea,
    );

  const usp =
    uniqueSellingPoint
      .replace(/\s+/g, " ")
      .trim();

  if (
    businessModel === "service"
  ) {
    const firstSentence =
      audience
        ? `${businessName} provides ${offering} for ${audience}${
            area
              ? ` in ${area}`
              : ""
          }.`
        : `${businessName} provides ${offering}${
            area
              ? ` in ${area}`
              : ""
          }.`;

    const secondSentence =
      usp
        ? normaliseSentence(usp)
        : "Every service is delivered with professionalism, clarity and close attention to the client’s needs.";

    return shorten(
      `${firstSentence} ${secondSentence}`,
      320,
    );
  }

  if (
    businessModel === "digital"
  ) {
    const firstSentence =
      audience
        ? `${businessName} creates ${offering} for ${audience}.`
        : `${businessName} creates ${offering}.`;

    const secondSentence =
      usp
        ? normaliseSentence(usp)
        : "Each digital product is designed to be practical, accessible and easy to use.";

    return shorten(
      `${firstSentence} ${secondSentence}`,
      320,
    );
  }

  const firstSentence =
    audience
      ? `${businessName} offers ${offering} for ${audience}.`
      : `${businessName} offers ${offering}.`;

  const secondSentence =
    usp
      ? normaliseSentence(usp)
      : "Customers can browse, order and shop with confidence.";

  return shorten(
    `${firstSentence} ${secondSentence}`,
    320,
  );
};

const createAboutText = (
  input: GeneratorInput,
) => {
  const {
    businessName,
    businessModel,
    offering,
    targetAudience,
    uniqueSellingPoint,
    serviceArea,
  } = input;

  const audience =
    getAudiencePhrase(
      targetAudience,
    );

  const area =
    getAreaPhrase(
      serviceArea,
    );

  const usp =
    uniqueSellingPoint
      .replace(/\s+/g, " ")
      .trim();

  if (
    businessModel === "service"
  ) {
    return shorten(
      [
        `${businessName} provides ${offering}${
          audience
            ? ` for ${audience}`
            : ""
        }${
          area
            ? ` in ${area}`
            : ""
        }.`,
        usp
          ? normaliseSentence(usp)
          : "The focus is on dependable service, clear communication and support tailored to each client.",
        "Every enquiry is handled with care so customers can understand their options and choose the right support.",
      ].join(" "),
      520,
    );
  }

  if (
    businessModel === "digital"
  ) {
    return shorten(
      [
        `${businessName} creates ${offering}${
          audience
            ? ` for ${audience}`
            : ""
        }.`,
        usp
          ? normaliseSentence(usp)
          : "Each resource is created to provide practical value and easy digital access.",
        "Customers can browse available resources and access the right digital product for their needs.",
      ].join(" "),
      520,
    );
  }

  return shorten(
    [
      `${businessName} offers ${offering}${
        audience
          ? ` for ${audience}`
          : ""
      }.`,
      usp
        ? normaliseSentence(usp)
        : "The collection is selected with quality, value and customer experience in mind.",
      "Customers can browse available products, order securely and discover items that suit their needs.",
    ].join(" "),
    520,
  );
};

const createFeaturedText = (
  input: GeneratorInput,
) => {
  const {
    businessModel,
    category,
    uniqueSellingPoint,
  } = input;

  const usp =
    uniqueSellingPoint
      .replace(/\s+/g, " ")
      .trim();

  if (usp) {
    return shorten(
      normaliseSentence(usp),
      180,
    );
  }

  if (
    businessModel === "service"
  ) {
    switch (category) {
      case "events":
        return "Thoughtful planning, creative direction and dependable coordination from concept to completion.";

      case "care-staffing":
        return "Carefully matched support designed around the needs of each household and individual.";

      case "cleaning":
        return "Reliable cleaning with attention to detail, presentation and the standard your space requires.";

      case "consulting":
      case "professional-services":
        return "Clear professional guidance focused on practical decisions, progress and measurable outcomes.";

      case "education-training":
        return "Practical learning and professional development designed to build confidence and capability.";

      default:
        return "Professional support designed around each client’s needs and desired outcome.";
    }
  }

  if (
    businessModel === "digital"
  ) {
    return "Practical digital resources created for convenient access, learning, productivity and progress.";
  }

  return "Quality products, straightforward ordering and support whenever you need it.";
};

const createTrustPoints = (
  input: GeneratorInput,
) => {
  const {
    businessModel,
    category,
  } = input;

  if (
    businessModel === "product"
  ) {
    return [
      "Quality products",
      "Direct support",
      "Secure checkout",
      "Reliable ordering",
    ];
  }

  if (
    businessModel === "digital"
  ) {
    return [
      "Instant digital access",
      "Practical resources",
      "Secure checkout",
      "Direct support",
    ];
  }

  switch (category) {
    case "events":
      return [
        "Thoughtful planning",
        "Trusted suppliers",
        "Clear communication",
        "Professional coordination",
      ];

    case "care-staffing":
      return [
        "Carefully matched support",
        "Dependable service",
        "Clear communication",
        "Family-focused approach",
      ];

    case "cleaning":
      return [
        "Reliable service",
        "Attention to detail",
        "Flexible scheduling",
        "Professional standards",
      ];

    case "consulting":
    case "professional-services":
      return [
        "Expert guidance",
        "Clear recommendations",
        "Practical solutions",
        "Professional delivery",
      ];

    case "education-training":
      return [
        "Practical learning",
        "Experienced support",
        "Clear instruction",
        "Progress-focused training",
      ];

    default:
      return [
        "Professional service",
        "Clear communication",
        "Reliable support",
        "Client-focused delivery",
      ];
  }
};

const createProcessSteps = (
  input: GeneratorInput,
): ProcessStep[] => {
  const {
    businessModel,
    category,
  } = input;

  if (
    businessModel === "product"
  ) {
    return [
      {
        title: "Browse the collection",
        description:
          "Explore available products and choose what suits you.",
      },
      {
        title: "Place your order",
        description:
          "Add your preferred items and complete your order securely.",
      },
      {
        title: "Receive your order",
        description:
          "Your order is prepared and fulfilled using the available delivery options.",
      },
    ];
  }

  if (
    businessModel === "digital"
  ) {
    return [
      {
        title: "Choose your resource",
        description:
          "Browse the available digital products and select the right option.",
      },
      {
        title: "Complete your order",
        description:
          "Purchase securely using the available payment options.",
      },
      {
        title: "Get access",
        description:
          "Receive access to your digital resource and start using it.",
      },
    ];
  }

  switch (category) {
    case "events":
      return [
        {
          title: "Share your vision",
          description:
            "Tell us about your occasion, priorities, style and what you would like to achieve.",
        },
        {
          title: "Receive your plan",
          description:
            "We shape the right planning, coordination and creative support around your event.",
        },
        {
          title: "Enjoy your celebration",
          description:
            "We help manage the details so you can focus on the experience and your guests.",
        },
      ];

    case "care-staffing":
      return [
        {
          title: "Tell us what you need",
          description:
            "Share the type of care, staffing or household support required.",
        },
        {
          title: "Review the right options",
          description:
            "Suitable support is considered based on your needs, expectations and circumstances.",
        },
        {
          title: "Start with confidence",
          description:
            "Move forward with clear communication and ongoing support.",
        },
      ];

    case "cleaning":
      return [
        {
          title: "Tell us about your space",
          description:
            "Share the property type, cleaning requirement and preferred schedule.",
        },
        {
          title: "Confirm the service",
          description:
            "We agree the right cleaning approach and practical details.",
        },
        {
          title: "Enjoy a cleaner space",
          description:
            "Your cleaning is completed professionally and with attention to detail.",
        },
      ];

    case "consulting":
    case "professional-services":
      return [
        {
          title: "Share the challenge",
          description:
            "Explain your goals, priorities or the issue you need help solving.",
        },
        {
          title: "Receive clear guidance",
          description:
            "We assess the situation and recommend a practical way forward.",
        },
        {
          title: "Move into action",
          description:
            "Use the agreed strategy, support or next steps to make progress.",
        },
      ];

    case "education-training":
      return [
        {
          title: "Choose your learning goal",
          description:
            "Identify the skill, subject or development outcome you want to achieve.",
        },
        {
          title: "Follow a clear learning path",
          description:
            "Receive practical instruction and support designed around your objectives.",
        },
        {
          title: "Apply what you learn",
          description:
            "Build confidence by putting your new knowledge and skills into practice.",
        },
      ];

    default:
      return [
        {
          title: "Tell us what you need",
          description:
            "Share your goals, requirements or the support you are looking for.",
        },
        {
          title: "Receive the right support",
          description:
            "We recommend the most suitable service or next step.",
        },
        {
          title: "Move forward",
          description:
            "Confirm the service and continue with clear professional support.",
        },
      ];
  }
};
const createReasons = (
  input: GeneratorInput,
) => {
  const {
    businessModel,
    category,
  } = input;

  if (
    businessModel === "product"
  ) {
    return [
      "Easy online ordering",
      "Clear product information",
      "Secure checkout",
      "Direct customer support",
    ];
  }

  if (
    businessModel === "digital"
  ) {
    return [
      "Instant online access",
      "Practical digital value",
      "Secure purchasing",
      "Simple customer support",
    ];
  }

  switch (category) {
    case "events":
      return [
        "Thoughtful planning from the start",
        "Professional coordination",
        "Attention to every detail",
        "A calm and organised experience",
      ];

    case "care-staffing":
      return [
        "Support matched to your needs",
        "Clear and responsive communication",
        "Dependable household support",
        "A family-focused approach",
      ];

    case "cleaning":
      return [
        "Reliable and professional service",
        "Attention to detail",
        "Flexible cleaning support",
        "Standards you can see",
      ];

    case "consulting":
    case "professional-services":
      return [
        "Clear professional guidance",
        "Practical recommendations",
        "Support built around your goals",
        "A focused approach to progress",
      ];

    case "education-training":
      return [
        "Practical and relevant learning",
        "Clear instruction",
        "Supportive development",
        "Skills you can apply",
      ];

    default:
      return [
        "Professional service",
        "Clear communication",
        "Reliable delivery",
        "Support built around your needs",
      ];
  }
};

const createSectionTitle = (
  input: GeneratorInput,
  categoryCopy: CategoryCopy,
) => {
  if (
    input.businessModel ===
    "product"
  ) {
    return (
      categoryCopy.sectionTitle ||
      "Shop the collection"
    );
  }

  if (
    input.businessModel ===
    "digital"
  ) {
    return (
      categoryCopy.sectionTitle ||
      "Digital products"
    );
  }

  return (
    categoryCopy.sectionTitle ||
    "Our services"
  );
};

const createSectionSubtitle = (
  input: GeneratorInput,
  categoryCopy: CategoryCopy,
) => {
  const offering =
    input.offering
      .replace(/\s+/g, " ")
      .trim();

  if (
    input.businessModel ===
    "service" &&
    offering
  ) {
    return shorten(
      categoryCopy.sectionSubtitle,
      180,
    );
  }

  return shorten(
    categoryCopy.sectionSubtitle,
    180,
  );
};

const createFeaturedLabel = (
  input: GeneratorInput,
  categoryCopy: CategoryCopy,
) => {
  if (
    input.businessModel ===
    "service"
  ) {
    return categoryCopy.eyebrow;
  }

  if (
    input.businessModel ===
    "digital"
  ) {
    return "Digital resources";
  }

  return "Featured products";
};

const createHeadline = (
  input: GeneratorInput,
  categoryCopy: CategoryCopy,
) => {
  const tone =
    input.tone ||
    "professional";

  const rewriteIndex =
    input.rewriteIndex || 0;

  return pickVariant(
    categoryCopy.headline[tone],
    rewriteIndex,
  );
};

const buildProductServices = (
  offering: string,
): ServiceCard[] => {
  const items =
    splitRawOffering(
      offering,
    )
      .map((item) =>
        item
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean)
      .slice(0, 6);

  return items.map(
    (item, index) => ({
      id: createId(
        item,
        index,
      ),
      title:
        titleCase(item),
      description:
        "Browse this product or category and view the available options.",
    }),
  );
};

const buildDigitalServices = (
  offering: string,
): ServiceCard[] => {
  const items =
    splitRawOffering(
      offering,
    )
      .map((item) =>
        item
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean)
      .slice(0, 6);

  return items.map(
    (item, index) => ({
      id: createId(
        item,
        index,
      ),
      title:
        titleCase(item),
      description:
        "A digital resource available for convenient online access.",
    }),
  );
};

const createServices = (
  input: GeneratorInput,
) => {
  if (
    input.businessModel ===
    "service"
  ) {
    return extractStructuredServices(
      input.offering,
      input.category,
    );
  }

  if (
    input.businessModel ===
    "digital"
  ) {
    return buildDigitalServices(
      input.offering,
    );
  }

  return buildProductServices(
    input.offering,
  );
};

const defaultProductServices =
  (): ServiceCard[] => [
    {
      id: "featured-products-0",
      title: "Featured Products",
      description:
        "Discover selected products available to order.",
    },
    {
      id: "new-arrivals-1",
      title: "New Arrivals",
      description:
        "Explore the latest additions to the collection.",
    },
    {
      id: "customer-support-2",
      title: "Customer Support",
      description:
        "Get help with product questions, orders and general enquiries.",
    },
  ];

const defaultDigitalServices =
  (): ServiceCard[] => [
    {
      id: "digital-products-0",
      title: "Digital Products",
      description:
        "Browse downloadable resources and online products.",
    },
    {
      id: "instant-access-1",
      title: "Instant Access",
      description:
        "Receive access to eligible digital purchases after checkout.",
    },
    {
      id: "customer-support-2",
      title: "Customer Support",
      description:
        "Get help with access, purchases and general questions.",
    },
  ];

const defaultServiceCards = (
  category: string,
): ServiceCard[] => {
  switch (category) {
    case "events":
      return [
        {
          id: "event-planning-0",
          title: "Event Planning",
          description:
            "Professional planning support from first concept through to final delivery.",
        },
        {
          id: "event-coordination-1",
          title: "Event Coordination",
          description:
            "Reliable coordination to help keep suppliers, timings and event-day details organised.",
        },
        {
          id: "event-styling-2",
          title: "Event Styling and Décor",
          description:
            "Creative styling and décor designed around the occasion and overall vision.",
        },
      ];

    case "care-staffing":
      return [
        {
          id: "caregiver-support-0",
          title: "Caregiver Support",
          description:
            "Dependable care support matched to the needs of the individual or household.",
        },
        {
          id: "domestic-staffing-1",
          title: "Domestic Staffing",
          description:
            "Reliable domestic staff matched to household requirements and routines.",
        },
        {
          id: "staff-placement-2",
          title: "Staff Recruitment and Placement",
          description:
            "Structured support to help families and organisations find suitable staff.",
        },
      ];

    case "cleaning":
      return [
        {
          id: "regular-cleaning-0",
          title: "Regular Cleaning",
          description:
            "Routine cleaning support to help keep homes and spaces fresh and well maintained.",
        },
        {
          id: "deep-cleaning-1",
          title: "Deep Cleaning",
          description:
            "Detailed cleaning for spaces that need extra attention beyond routine maintenance.",
        },
        {
          id: "commercial-cleaning-2",
          title: "Commercial Cleaning",
          description:
            "Professional cleaning for offices, workplaces and commercial environments.",
        },
      ];

    case "consulting":
    case "professional-services":
      return [
        {
          id: "consultation-0",
          title: "Consultation",
          description:
            "Discuss your goals, challenges and the support you need.",
        },
        {
          id: "strategy-1",
          title: "Strategy and Guidance",
          description:
            "Receive clear professional recommendations and practical next steps.",
        },
        {
          id: "ongoing-support-2",
          title: "Ongoing Support",
          description:
            "Continue with professional support as your needs and priorities develop.",
        },
      ];

    case "education-training":
      return [
        {
          id: "training-0",
          title: "Training",
          description:
            "Practical learning designed around clear development goals.",
        },
        {
          id: "coaching-1",
          title: "Coaching",
          description:
            "Focused guidance and support to help build confidence and capability.",
        },
        {
          id: "development-2",
          title: "Professional Development",
          description:
            "Structured learning to help strengthen skills and improve performance.",
        },
      ];

    default:
      return [
        {
          id: "service-0",
          title: "Professional Service",
          description:
            "Professional support tailored around the client’s needs.",
        },
        {
          id: "consultation-1",
          title: "Consultation",
          description:
            "Discuss your requirements and identify the right next step.",
        },
        {
          id: "support-2",
          title: "Ongoing Support",
          description:
            "Continue with dependable professional support as needed.",
        },
      ];
  }
};
const ensureServices = (
  services: ServiceCard[],
  input: GeneratorInput,
) => {
  if (services.length > 0) {
    return services;
  }

  if (
    input.businessModel ===
    "product"
  ) {
    return defaultProductServices();
  }

  if (
    input.businessModel ===
    "digital"
  ) {
    return defaultDigitalServices();
  }

  return defaultServiceCards(
    input.category,
  );
};

const createProfessionalVariation = (
  input: GeneratorInput,
  generated: GeneratedContent,
): GeneratedContent => {
  if (
    input.tone !== "professional"
  ) {
    return generated;
  }

  return {
    ...generated,
    introduction:
      generated.introduction,
    aboutText:
      generated.aboutText,
  };
};

const createWarmVariation = (
  input: GeneratorInput,
  generated: GeneratedContent,
): GeneratedContent => {
  if (
    input.tone !== "warm"
  ) {
    return generated;
  }

  return {
    ...generated,
    introduction:
      generated.introduction,
    aboutText:
      generated.aboutText,
  };
};

const createPremiumVariation = (
  input: GeneratorInput,
  generated: GeneratedContent,
): GeneratedContent => {
  if (
    input.tone !== "premium"
  ) {
    return generated;
  }

  const premiumReasons =
    generated.reasons.map(
      (reason) =>
        reason
          .replace(
            /^Reliable\b/i,
            "Exceptional",
          )
          .replace(
            /^Professional\b/i,
            "Expert",
          ),
    );

  return {
    ...generated,
    reasons:
      premiumReasons,
  };
};

const createBoldVariation = (
  input: GeneratorInput,
  generated: GeneratedContent,
): GeneratedContent => {
  if (
    input.tone !== "bold"
  ) {
    return generated;
  }

  return {
    ...generated,
    featuredText:
      generated.featuredText,
  };
};

const createFriendlyVariation = (
  input: GeneratorInput,
  generated: GeneratedContent,
): GeneratedContent => {
  if (
    input.tone !== "friendly"
  ) {
    return generated;
  }

  return {
    ...generated,
    featuredText:
      generated.featuredText,
  };
};

const applyToneVariation = (
  input: GeneratorInput,
  generated: GeneratedContent,
) => {
  const professional =
    createProfessionalVariation(
      input,
      generated,
    );

  const warm =
    createWarmVariation(
      input,
      professional,
    );

  const premium =
    createPremiumVariation(
      input,
      warm,
    );

  const bold =
    createBoldVariation(
      input,
      premium,
    );

  return createFriendlyVariation(
    input,
    bold,
  );
};

const cleanInputValue = (
  value?: string,
) =>
  (value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normaliseGeneratorInput = (
  input: GeneratorInput,
): GeneratorInput => ({
  businessName:
    cleanInputValue(
      input.businessName,
    ),
  businessModel:
    input.businessModel,
  category:
    cleanInputValue(
      input.category,
    ),
  offering:
    cleanInputValue(
      input.offering,
    ),
  targetAudience:
    cleanInputValue(
      input.targetAudience,
    ),
  uniqueSellingPoint:
    cleanInputValue(
      input.uniqueSellingPoint,
    ),
  serviceArea:
    cleanInputValue(
      input.serviceArea,
    ),
  tone:
    input.tone ||
    "professional",
  rewriteIndex:
    Number.isFinite(
      input.rewriteIndex,
    )
      ? input.rewriteIndex
      : 0,
});

const buildGeneratedContent = (
  input: GeneratorInput,
): GeneratedContent => {
  const categoryCopy =
    getCategoryCopy(
      input.businessModel,
      input.category,
    );

  const services =
    ensureServices(
      createServices(input),
      input,
    );

  return {
    shortDescription:
      createShortDescription(
        input,
      ),

    headline:
      createHeadline(
        input,
        categoryCopy,
      ),

    introduction:
      createIntroduction(
        input,
        categoryCopy,
      ),

    aboutTitle:
      "About us",

    aboutText:
      createAboutText(
        input,
      ),

    sectionTitle:
      createSectionTitle(
        input,
        categoryCopy,
      ),

    sectionSubtitle:
      createSectionSubtitle(
        input,
        categoryCopy,
      ),

    featuredLabel:
      createFeaturedLabel(
        input,
        categoryCopy,
      ),

    featuredText:
      createFeaturedText(
        input,
      ),

    services,

    trustPoints:
      createTrustPoints(
        input,
      ),

    processSteps:
      createProcessSteps(
        input,
      ),

    reasons:
      createReasons(
        input,
      ),
  };
};
export const generateStorefrontContent = (
  rawInput: GeneratorInput,
): GeneratedContent => {
  const input =
    normaliseGeneratorInput(
      rawInput,
    );

  const generated =
    buildGeneratedContent(
      input,
    );

  return applyToneVariation(
    input,
    generated,
  );
};

export const rewriteStorefrontContent = (
  input: GeneratorInput,
  rewriteIndex: number,
) =>
  generateStorefrontContent({
    ...input,
    rewriteIndex,
  });

export const getDefaultContentTone = (
  businessModel: BusinessModel,
  category: string,
): ContentTone => {
  if (
    businessModel === "service"
  ) {
    switch (category) {
      case "events":
        return "premium";

      case "care-staffing":
        return "warm";

      case "cleaning":
        return "professional";

      case "consulting":
      case "professional-services":
        return "professional";

      case "education-training":
        return "professional";

      case "beauty-services":
        return "warm";

      default:
        return "professional";
    }
  }

  if (
    businessModel === "digital"
  ) {
    return "professional";
  }

  return "friendly";
};

export const getAvailableContentTones =
  (): Array<{
    value: ContentTone;
    label: string;
    description: string;
  }> => [
    {
      value: "professional",
      label: "Professional",
      description:
        "Clear, credible and business-focused.",
    },
    {
      value: "warm",
      label: "Warm",
      description:
        "Welcoming, reassuring and people-focused.",
    },
    {
      value: "premium",
      label: "Premium",
      description:
        "Refined, polished and elevated.",
    },
    {
      value: "bold",
      label: "Bold",
      description:
        "Confident, energetic and direct.",
    },
    {
      value: "friendly",
      label: "Friendly",
      description:
        "Simple, approachable and conversational.",
    },
  ];

export const isServiceBusinessCategory = (
  category: string,
) =>
  [
    "care-staffing",
    "cleaning",
    "events",
    "consulting",
    "beauty-services",
    "property-services",
    "education-training",
    "repairs",
    "professional-services",
  ].includes(category);

export const isProductBusinessCategory = (
  category: string,
) =>
  [
    "fashion",
    "wigs",
    "beauty",
    "food",
    "electronics",
    "home",
    "other-product",
  ].includes(category);

export const isDigitalBusinessCategory = (
  category: string,
) =>
  [
    "ebooks-guides",
    "templates",
    "online-courses",
    "digital-art",
    "software-tools",
    "other-digital",
  ].includes(category);

export const getBusinessModelForCategory = (
  category: string,
): BusinessModel => {
  if (
    isServiceBusinessCategory(
      category,
    )
  ) {
    return "service";
  }

  if (
    isDigitalBusinessCategory(
      category,
    )
  ) {
    return "digital";
  }

  return "product";
};

export const cleanGeneratedText = (
  value: string,
) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/â€¦|Â…/g, "…")
    .replace(/â€™|Â’/g, "'")
    .replace(/â€œ|â€|Â“|Â”/g, '"')
    .replace(/â€“|Â–/g, "–")
    .replace(/â€”|Â—/g, "—")
    .replace(/â‚¦|Â₦/g, "₦")
    .replace(/â€Œ|Â/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cleanServiceCard = (
  service: ServiceCard,
): ServiceCard => ({
  ...service,
  title:
    cleanGeneratedText(
      service.title,
    ),
  description:
    cleanGeneratedText(
      service.description,
    ),
});

const cleanProcessStep = (
  step: ProcessStep,
): ProcessStep => ({
  title:
    cleanGeneratedText(
      step.title,
    ),
  description:
    cleanGeneratedText(
      step.description,
    ),
});

export const sanitiseGeneratedContent = (
  content: GeneratedContent,
): GeneratedContent => ({
  shortDescription:
    cleanGeneratedText(
      content.shortDescription,
    ),
  headline:
    cleanGeneratedText(
      content.headline,
    ),
  introduction:
    cleanGeneratedText(
      content.introduction,
    ),
  aboutTitle:
    cleanGeneratedText(
      content.aboutTitle,
    ),
  aboutText:
    cleanGeneratedText(
      content.aboutText,
    ),
  sectionTitle:
    cleanGeneratedText(
      content.sectionTitle,
    ),
  sectionSubtitle:
    cleanGeneratedText(
      content.sectionSubtitle,
    ),
  featuredLabel:
    cleanGeneratedText(
      content.featuredLabel,
    ),
  featuredText:
    cleanGeneratedText(
      content.featuredText,
    ),
  services:
    content.services.map(
      cleanServiceCard,
    ),
  trustPoints:
    content.trustPoints.map(
      cleanGeneratedText,
    ),
  processSteps:
    content.processSteps.map(
      cleanProcessStep,
    ),
  reasons:
    content.reasons.map(
      cleanGeneratedText,
    ),
});
export const createStorefrontContent = (
  input: GeneratorInput,
): GeneratedContent =>
  sanitiseGeneratedContent(
    generateStorefrontContent(
      input,
    ),
  );

export const createRewrittenStorefrontContent = (
  input: GeneratorInput,
  rewriteIndex: number,
): GeneratedContent =>
  sanitiseGeneratedContent(
    rewriteStorefrontContent(
      input,
      rewriteIndex,
    ),
  );