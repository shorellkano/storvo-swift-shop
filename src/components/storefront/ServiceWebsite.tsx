import { useMemo, useState } from "react";
import {
  ArrowRight,
  Baby,
  Building2,
  CalendarDays,
  Camera,
  Car,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CookingPot,
  HeartHandshake,
  Home,
  Images,
  Menu,
  MessageCircle,
  Palette,
  PartyPopper,
  Quote,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import StoreContactFooter from "@/components/storefront/StoreContactFooter";

type ServiceItem = {
  title: string;
  description: string;
};

type GalleryItem = {
  title: string;
  description: string;
  imageUrl: string;
  date?: string;
  location?: string;
};

type UpcomingEvent = {
  title: string;
  description: string;
  date: string;
  location?: string;
};

type ProcessStep = {
  title: string;
  description: string;
};

type ServiceWebsiteProps = {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  openingHours?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  x?: string | null;
  youtube?: string | null;
  snapchat?: string | null;

  founderEnabled?: boolean;
  founderSectionTitle?: string;
  founderName?: string;
  founderRole?: string;
  founderPhotoUrl?: string | null;
  founderBio?: string;
  founderQuote?: string;
  founderProfileUrl?: string;
  founderButtonText?: string;

  isPro: boolean;
  showDeliveryPolicy?: boolean;
  showReturnsPolicy?: boolean;

  storeName: string;
  logoUrl?: string | null;

  headline: string;
  introduction: string;

  aboutTitle: string;
  aboutText: string;

  serviceArea?: string;

  primaryCta: string;
  secondaryCta: string;
  enquiryButtonText: string;

  services: ServiceItem[];
  trustPoints: string[];
  processSteps: ProcessStep[];
  reasons: string[];

  whyChooseHeading: string;
  heroEyebrow: string;
  aboutHighlightHeading: string;
  servicesIntroduction: string;

  galleryItems: GalleryItem[];
  upcomingEvents: UpcomingEvent[];

  brandColor: string;
  accentColor: string;

  isOwner: boolean;

  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onServiceEnquiry: (
    serviceTitle: string,
  ) => void;
  onGalleryImageClick: (
    item: GalleryItem,
  ) => void;
};

const cleanText = (
  value: string,
) =>
  value
    .replace(/â€¦|Â…/g, "…")
    .replace(/â€™|Â’/g, "'")
    .replace(
      /â€œ|â€|Â“|Â”/g,
      '"',
    )
    .replace(/â€“|Â–/g, "-")
    .replace(/â€”|Â—/g, "-")
    .replace(/â‚¦|Â₦/g, "₦")
    .replace(/Ourâ\S*/gi, "")
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const limitWords = (
  value: string,
  maximumWords: number,
) => {
  const words = cleanText(
    value,
  )
    .split(" ")
    .filter(Boolean);

  if (
    words.length <=
    maximumWords
  ) {
    return words.join(" ");
  }

  return `${words
    .slice(
      0,
      maximumWords,
    )
    .join(" ")}…`;
};

const getServiceIcon = (
  serviceTitle: string,
): LucideIcon => {
  const title =
    serviceTitle.toLowerCase();

  if (
    title.includes(
      "wedding",
    ) ||
    title.includes(
      "celebration",
    )
  ) {
    return PartyPopper;
  }

  if (
    title.includes(
      "event styling",
    ) ||
    title.includes("decor") ||
    title.includes("décor")
  ) {
    return Palette;
  }

  if (
    title.includes(
      "corporate",
    ) ||
    title.includes(
      "business",
    )
  ) {
    return Building2;
  }

  if (
    title.includes(
      "vendor",
    ) ||
    title.includes(
      "supplier",
    )
  ) {
    return Users;
  }

  if (
    title.includes(
      "coordination",
    ) ||
    title.includes(
      "planning",
    )
  ) {
    return ClipboardCheck;
  }

  if (
    title.includes(
      "photography",
    ) ||
    title.includes("photo")
  ) {
    return Camera;
  }

  if (
    title.includes(
      "catering",
    ) ||
    title.includes("food") ||
    title.includes("dish")
  ) {
    return UtensilsCrossed;
  }

  if (
    title.includes("cook") ||
    title.includes("chef")
  ) {
    return CookingPot;
  }

  if (
    title.includes("car") ||
    title.includes(
      "driver",
    ) ||
    title.includes(
      "transport",
    )
  ) {
    return Car;
  }

  if (
    title.includes(
      "clean",
    ) ||
    title.includes(
      "housekeeping",
    )
  ) {
    return SprayCan;
  }

  if (
    title.includes("care") ||
    title.includes(
      "elderly",
    ) ||
    title.includes(
      "support",
    )
  ) {
    return HeartHandshake;
  }

  if (
    title.includes(
      "nanny",
    ) ||
    title.includes("child")
  ) {
    return Baby;
  }

  if (
    title.includes(
      "property",
    ) ||
    title.includes("home")
  ) {
    return Home;
  }

  if (
    title.includes(
      "creative",
    ) ||
    title.includes(
      "design",
    )
  ) {
    return WandSparkles;
  }

  return Sparkles;
};

const ServiceWebsite = ({
  phone,
  whatsapp,
  email,
  address,
  openingHours,
  instagram,
  facebook,
  tiktok,
  linkedin,
  x,
  youtube,
  snapchat,

  founderEnabled = false,
  founderSectionTitle =
    "Meet the founder",
  founderName = "",
  founderRole = "",
  founderPhotoUrl,
  founderBio = "",
  founderQuote = "",
  founderProfileUrl = "",
  founderButtonText =
    "Learn more",

  isPro,
  showDeliveryPolicy = false,
  showReturnsPolicy = false,

  storeName,
  logoUrl,

  headline,
  introduction,

  aboutTitle,
  aboutText,
  serviceArea,

  primaryCta,
  secondaryCta,
  enquiryButtonText,

  services,
  trustPoints,
  processSteps,

  whyChooseHeading,
  heroEyebrow,
  aboutHighlightHeading,
  servicesIntroduction,

  reasons,
  galleryItems,
  upcomingEvents,

  brandColor,
  accentColor,
  isOwner,

  onPrimaryAction,
  onSecondaryAction,
  onServiceEnquiry,
  onGalleryImageClick,
}: ServiceWebsiteProps) => {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    aboutExpanded,
    setAboutExpanded,
  ] = useState(false);

  const [
    showAllServices,
    setShowAllServices,
  ] = useState(false);

  const aboutPreview =
    useMemo(
      () =>
        limitWords(
          aboutText,
          55,
        ),
      [aboutText],
    );

  const hasLongAbout =
    useMemo(
      () =>
        cleanText(
          aboutText,
        )
          .split(" ")
          .filter(Boolean)
          .length > 55,
      [aboutText],
    );

  const visibleServices =
    showAllServices
      ? services.slice(
          0,
          8,
        )
      : services.slice(
          0,
          3,
        );

  const safeFounderName =
    cleanText(
      founderName,
    );

  const safeFounderRole =
    cleanText(
      founderRole,
    );

  const safeFounderBio =
    cleanText(
      founderBio,
    );

  const safeFounderQuote =
    cleanText(
      founderQuote,
    );

  const showFounderSection =
    founderEnabled &&
    Boolean(
      safeFounderName ||
        safeFounderBio ||
        founderPhotoUrl,
    );

  const founderLink =
    founderProfileUrl.trim();
      const navigationItems = [
    {
      label: "Home",
      id: "service-home",
      visible: true,
    },
    {
      label: "About",
      id: "service-about",
      visible: Boolean(
        aboutText,
      ),
    },
    {
      label: "Founder",
      id: "service-founder",
      visible:
        showFounderSection,
    },
    {
      label: "Services",
      id: "service-services",
      visible:
        services.length > 0,
    },
    {
      label: "Gallery",
      id: "service-gallery",
      visible:
        galleryItems.length >
          0 ||
        isOwner,
    },
    {
      label: "Events",
      id: "service-events",
      visible:
        upcomingEvents.length >
        0,
    },
    {
      label: "Contact",
      id: "store-contact",
      visible: true,
    },
  ].filter(
    (item) =>
      item.visible,
  );

  const scrollToSection = (
    id: string,
  ) => {
    setMobileMenuOpen(
      false,
    );

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="space-y-6">
      <section
        id="service-home"
        className="scroll-mt-24 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm"
      >
        <div className="border-b border-border/60 px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "service-home",
                )
              }
              className="flex min-w-0 items-center gap-3"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${storeName} logo`}
                  className="h-10 w-10 rounded-xl object-contain"
                />
              ) : (
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{
                    backgroundColor:
                      brandColor,
                  }}
                >
                  {storeName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <span className="truncate font-display text-base font-black text-foreground sm:text-lg">
                {storeName}
              </span>
            </button>

            <div className="hidden items-center gap-1 lg:flex">
              {navigationItems.map(
                (item) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      scrollToSection(
                        item.id,
                      )
                    }
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={
                  onSecondaryAction
                }
                className="hidden sm:inline-flex"
                style={{
                  backgroundColor:
                    brandColor,
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact
              </Button>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    (current) =>
                      !current,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background lg:hidden"
                aria-label="Open navigation"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 grid gap-2 border-t border-border/60 pt-4 lg:hidden">
              {navigationItems.map(
                (item) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      scrollToSection(
                        item.id,
                      )
                    }
                    className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-6 sm:p-10 lg:p-12">
            <p
              className="text-xs font-black uppercase tracking-[0.2em]"
              style={{
                color:
                  brandColor,
              }}
            >
              {heroEyebrow}
            </p>

            <h1 className="mt-5 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {headline}
            </h1>

            {introduction && (
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {introduction}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                onClick={
                  onPrimaryAction
                }
                className="font-bold text-white"
                style={{
                  backgroundColor:
                    brandColor,
                }}
              >
                {primaryCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={
                  onSecondaryAction
                }
                className="font-bold"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {secondaryCta}
              </Button>
            </div>

            {serviceArea && (
              <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Service area
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                  {serviceArea}
                </p>
              </div>
            )}
          </div>

          <div
            className="relative flex min-h-[340px] items-center justify-center overflow-hidden p-8 sm:min-h-[440px]"
            style={{
              background: `linear-gradient(145deg, ${brandColor}, ${accentColor})`,
            }}
          >
            <div
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
              style={{
                backgroundColor:
                  "#ffffff",
              }}
            />

            <div
              className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-10"
              style={{
                backgroundColor:
                  "#ffffff",
              }}
            />

            <div className="relative max-w-md text-center text-white">
              <Sparkles className="mx-auto h-11 w-11" />

              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                {aboutHighlightHeading}
              </p>

              <p className="mt-4 font-display text-2xl font-black leading-tight sm:text-3xl">
                {limitWords(
                  introduction ||
                    aboutText,
                  24,
                )}
              </p>

              {trustPoints.length >
                0 && (
                <div className="mt-7 grid gap-3 text-left">
                  {trustPoints
                    .slice(0, 3)
                    .map(
                      (
                        item,
                      ) => (
                        <div
                          key={
                            item
                          }
                          className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                          <span className="text-sm font-semibold leading-6 text-white">
                            {item}
                          </span>
                        </div>
                      ),
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {aboutText && (
        <section
          id="service-about"
          className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-9"
        >
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.18em]"
                style={{
                  color:
                    brandColor,
                }}
              >
                About
              </p>

              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
                {aboutTitle}
              </h2>
            </div>

            <div>
              <p className="text-base leading-8 text-muted-foreground">
                {aboutExpanded
                  ? cleanText(
                      aboutText,
                    )
                  : aboutPreview}
              </p>

              {hasLongAbout && (
                <button
                  type="button"
                  onClick={() =>
                    setAboutExpanded(
                      (
                        current,
                      ) =>
                        !current,
                    )
                  }
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold"
                  style={{
                    color:
                      brandColor,
                  }}
                >
                  {aboutExpanded
                    ? "Show less"
                    : "Read more"}

                  {aboutExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {showFounderSection && (
        <section
          id="service-founder"
          className="scroll-mt-24 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm"
        >
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            <div
              className="flex min-h-[300px] items-center justify-center p-7 sm:p-10"
              style={{
                background: `linear-gradient(145deg, ${brandColor}16, ${accentColor}24)`,
              }}
            >
              {founderPhotoUrl ? (
                <img
                  src={
                    founderPhotoUrl
                  }
                  alt={
                    safeFounderName ||
                    "Founder"
                  }
                  className="aspect-square w-full max-w-[280px] rounded-3xl object-cover shadow-lg"
                />
              ) : (
                <div
                  className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-3xl"
                  style={{
                    backgroundColor: `${brandColor}14`,
                    color:
                      brandColor,
                  }}
                >
                  <UserRound className="h-20 w-20" />
                </div>
              )}
            </div>

            <div className="p-7 sm:p-10">
              <p
                className="text-xs font-black uppercase tracking-[0.18em]"
                style={{
                  color:
                    brandColor,
                }}
              >
                {founderSectionTitle}
              </p>

              {safeFounderName && (
                <h2 className="mt-3 font-display text-3xl font-black text-foreground sm:text-4xl">
                  {safeFounderName}
                </h2>
              )}

              {safeFounderRole && (
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  {safeFounderRole}
                </p>
              )}

              {safeFounderBio && (
                <p className="mt-6 leading-8 text-muted-foreground">
                  {safeFounderBio}
                </p>
              )}

              {safeFounderQuote && (
                <div className="mt-7 rounded-2xl border border-border/60 bg-muted/30 p-5">
                  <Quote
                    className="h-6 w-6"
                    style={{
                      color:
                        brandColor,
                    }}
                  />

                  <p className="mt-3 font-semibold italic leading-7 text-foreground">
                    “
                    {
                      safeFounderQuote
                    }
                    ”
                  </p>
                </div>
              )}

              {founderLink && (
                <a
                  href={
                    founderLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold"
                  style={{
                    color:
                      brandColor,
                  }}
                >
                  {founderButtonText}
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}
                  
      {services.length > 0 && (
        <section
          id="service-services"
          className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-9"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.2em]"
                style={{
                  color:
                    brandColor,
                }}
              >
                What we do
              </p>

              <h2 className="mt-2 font-display text-3xl font-black text-foreground sm:text-4xl">
                Featured services
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                {servicesIntroduction}
              </p>
            </div>

            {services.length >
              3 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllServices(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-black"
                style={{
                  color:
                    brandColor,
                }}
              >
                {showAllServices
                  ? "Show featured services"
                  : "View all services"}

                {showAllServices ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map(
              (
                service,
                index,
              ) => {
                const Icon =
                  getServiceIcon(
                    service.title,
                  );

                return (
                  <article
                    key={`${service.title}-${index}`}
                    className="group flex min-h-[230px] flex-col rounded-2xl border border-border/70 bg-background p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105"
                        style={{
                          backgroundColor: `${brandColor}12`,
                          color:
                            brandColor,
                        }}
                      >
                        <Icon className="h-6 w-6" />
                      </span>

                      <span className="text-sm font-black text-muted-foreground/40">
                        0
                        {index +
                          1}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-black text-foreground">
                      {
                        service.title
                      }
                    </h3>

                    {service.description && (
                      <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                        {limitWords(
                          service.description,
                          24,
                        )}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onServiceEnquiry(
                          service.title,
                        )
                      }
                      className="mt-6 inline-flex items-center gap-2 text-sm font-black"
                      style={{
                        color:
                          brandColor,
                      }}
                    >
                      Enquire about this service
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </article>
                );
              },
            )}
          </div>
        </section>
      )}

      <section
        id="service-gallery"
        className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-9"
      >
        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{
              color:
                brandColor,
            }}
          >
            Visual showcase
          </p>

          <h2 className="mt-2 font-display text-3xl font-black text-foreground sm:text-4xl">
            Past work and highlights
          </h2>
        </div>

        {galleryItems.length >
        0 ? (
          <div className="mt-8 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map(
              (
                item,
                index,
              ) => (
                <button
                  type="button"
                  key={`${item.title}-${index}`}
                  onClick={() =>
                    onGalleryImageClick(
                      item,
                    )
                  }
                  className={`group relative overflow-hidden rounded-2xl text-left ${
                    index === 0
                      ? "sm:row-span-2"
                      : ""
                  }`}
                >
                  <img
                    src={
                      item.imageUrl
                    }
                    alt={
                      item.title
                    }
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="font-display text-xl font-black">
                      {
                        item.title
                      }
                    </h3>

                    {(item.date ||
                      item.location) && (
                      <p className="mt-2 text-xs text-white/75">
                        {[
                          item.date,
                          item.location,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            " • ",
                          )}
                      </p>
                    )}
                  </div>
                </button>
              ),
            )}
          </div>
        ) : isOwner ? (
          <div className="mt-8 flex min-h-[260px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/20 px-6 text-center">
            <Images className="h-10 w-10 text-muted-foreground" />

            <h3 className="mt-4 text-lg font-black text-foreground">
              Your gallery will appear here
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Upload at least one image in Store Settings, add its title, enable Show Gallery and save your changes.
            </p>
          </div>
        ) : null}
      </section>

      {processSteps.length >
        0 && (
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-9">
          <p
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{
              color:
                brandColor,
            }}
          >
            Simple process
          </p>

          <h2 className="mt-2 font-display text-3xl font-black text-foreground sm:text-4xl">
            How it works
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {processSteps
              .slice(
                0,
                4,
              )
              .map(
                (
                  step,
                  index,
                ) => (
                  <article
                    key={
                      step.title
                    }
                    className="rounded-2xl border border-border/60 bg-background p-5"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black"
                      style={{
                        backgroundColor: `${brandColor}12`,
                        color:
                          brandColor,
                      }}
                    >
                      0
                      {index +
                        1}
                    </span>

                    <h3 className="mt-5 font-black text-foreground">
                      {
                        step.title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {limitWords(
                        step.description,
                        22,
                      )}
                    </p>
                  </article>
                ),
              )}
          </div>
        </section>
      )}

      {upcomingEvents.length >
        0 && (
        <section
          id="service-events"
          className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-9"
        >
          <p
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{
              color:
                brandColor,
            }}
          >
            Upcoming
          </p>

          <h2 className="mt-2 font-display text-3xl font-black text-foreground sm:text-4xl">
            Upcoming events
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {upcomingEvents.map(
              (
                event,
                index,
              ) => (
                <article
                  key={`${event.title}-${index}`}
                  className="flex gap-4 rounded-2xl border border-border/60 bg-background p-5"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${brandColor}12`,
                      color:
                        brandColor,
                    }}
                  >
                    <CalendarDays className="h-6 w-6" />
                  </span>

                  <div>
                    <h3 className="font-black text-foreground">
                      {
                        event.title
                      }
                    </h3>

                    <p
                      className="mt-1 text-sm font-bold"
                      style={{
                        color:
                          brandColor,
                      }}
                    >
                      {
                        event.date
                      }
                    </p>

                    {event.description && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {limitWords(
                          event.description,
                          22,
                        )}
                      </p>
                    )}

                    {event.location && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {
                          event.location
                        }
                      </p>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}
            {reasons.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
            <div
              className="p-7 text-white sm:p-10"
              style={{
                backgroundColor:
                  brandColor,
              }}
            >
              <ShieldCheck className="h-9 w-9" />

              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Why choose us
              </p>

              <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
                {whyChooseHeading}
              </h2>
            </div>

            <div className="grid gap-3 p-6 sm:p-9">
              {reasons
                .slice(0, 5)
                .map(
                  (
                    reason,
                  ) => (
                    <div
                      key={
                        reason
                      }
                      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0"
                        style={{
                          color:
                            brandColor,
                        }}
                      />

                      <p className="text-sm font-semibold leading-6 text-foreground">
                        {
                          reason
                        }
                      </p>
                    </div>
                  ),
                )}
            </div>
          </div>
        </section>
      )}

      <StoreContactFooter
        storeName={
          storeName
        }
        storeSlug={
          window.location.pathname
            .split(
              "/store/",
            )[1]
            ?.split(
              "/",
            )[0] || ""
        }
        logoUrl={
          logoUrl
        }
        brandColor={
          brandColor
        }
        accentColor={
          accentColor
        }
        phone={
          phone
        }
        whatsapp={
          whatsapp
        }
        email={
          email
        }
        address={
          address
        }
        serviceArea={
          serviceArea
        }
        openingHours={
          openingHours
        }
        instagram={
          instagram
        }
        facebook={
          facebook
        }
        tiktok={
          tiktok
        }
        linkedin={
          linkedin
        }
        x={
          x
        }
        youtube={
          youtube
        }
        snapchat={
          snapchat
        }
        isPro={
          isPro
        }
        showDeliveryPolicy={
          showDeliveryPolicy
        }
        showReturnsPolicy={
          showReturnsPolicy
        }
        onWhatsApp={
          onSecondaryAction
        }
      />
    </div>
  );
};

export default ServiceWebsite;