import {
  AtSign,
  Clock3,
  Facebook,
  Ghost,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  ShieldCheck,
  Store,
  Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import storvoLogo from "@/assets/storvo-logo.png";

type StoreContactFooterProps = {
  storeName: string;
  storeSlug: string;
  logoUrl?: string | null;
  brandColor: string;
  accentColor?: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  serviceArea?: string | null;
  openingHours?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  x?: string | null;
  youtube?: string | null;
  snapchat?: string | null;
  isPro: boolean;
  showDeliveryPolicy?: boolean;
  showReturnsPolicy?: boolean;
  onWhatsApp?: () => void;
};

type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "x"
  | "youtube"
  | "snapchat";

type SocialItem = {
  platform: SocialPlatform;
  label: string;
  value: string;
  url: string;
  Icon: typeof Instagram;
};

const cleanValue = (
  value?: string | null,
) => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "";
  }

  return value
    .replace(/â€¦|Â…/g, "…")
    .replace(/â€™|Â’/g, "'")
    .replace(/â€œ|â€|Â“|Â”/g, '"')
    .replace(/â€“|Â–/g, "-")
    .replace(/â€”|Â—/g, "-")
    .replace(/â‚¦|Â₦/g, "₦")
    .replace(/\s+/g, " ")
    .trim();
};

const normalisePhoneLink = (
  phone: string,
) => phone.replace(/[^\d+]/g, "");

const normaliseWhatsAppLink = (
  phone: string,
) => phone.replace(/\D/g, "");

const isFullUrl = (
  value: string,
) => /^https?:\/\//i.test(value.trim());

const cleanSocialHandle = (
  value: string,
) =>
  value
    .trim()
    .replace(/^@/, "")
    .replace(/^\/+|\/+$/g, "");

const createSocialUrl = (
  platform: SocialPlatform,
  rawValue: string,
) => {
  const value = rawValue.trim();

  if (!value) {
    return "";
  }

  if (isFullUrl(value)) {
    return value;
  }

  const withoutDomain = value
    .replace(
      /^(www\.)?(instagram\.com|facebook\.com|fb\.com|tiktok\.com|linkedin\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|snapchat\.com)\//i,
      "",
    )
    .replace(/^@/, "")
    .replace(/^\/+|\/+$/g, "");

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${withoutDomain}`;

    case "facebook":
      return `https://facebook.com/${withoutDomain}`;

    case "tiktok":
      return `https://tiktok.com/@${withoutDomain.replace(
        /^@/,
        "",
      )}`;

    case "linkedin":
      if (
        /^(company|in)\//i.test(
          withoutDomain,
        )
      ) {
        return `https://linkedin.com/${withoutDomain}`;
      }

      return `https://linkedin.com/in/${withoutDomain}`;

    case "x":
      return `https://x.com/${withoutDomain}`;

    case "youtube":
      if (
        /^(channel|c|user|@)\//i.test(
          withoutDomain,
        ) ||
        withoutDomain.startsWith("@")
      ) {
        return `https://youtube.com/${withoutDomain}`;
      }

      return `https://youtube.com/@${withoutDomain}`;

    case "snapchat":
      return `https://snapchat.com/add/${withoutDomain}`;

    default:
      return "";
  }
};

const displaySocialValue = (
  platform: SocialPlatform,
  value: string,
) => {
  if (isFullUrl(value)) {
    try {
      const parsed = new URL(value);
      const path = parsed.pathname
        .replace(/^\/+|\/+$/g, "");

      if (path) {
        const finalPart =
          path.split("/").filter(Boolean).pop() ||
          path;

        return platform === "linkedin"
          ? finalPart
          : `@${finalPart.replace(/^@/, "")}`;
      }

      return parsed.hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return value;
    }
  }

  const cleaned = cleanSocialHandle(
    value.replace(
      /^(www\.)?(instagram\.com|facebook\.com|fb\.com|tiktok\.com|linkedin\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|snapchat\.com)\//i,
      "",
    ),
  );

  if (platform === "linkedin") {
    return cleaned
      .replace(/^(company|in)\//i, "")
      .replace(/^@/, "");
  }

  return `@${cleaned.replace(/^@/, "")}`;
};

const StoreContactFooter = ({
  storeName,
  storeSlug,
  logoUrl,
  brandColor,
  accentColor = brandColor,
  phone,
  whatsapp,
  email,
  address,
  serviceArea,
  openingHours,
  instagram,
  facebook,
  tiktok,
  linkedin,
  x,
  youtube,
  snapchat,
  isPro,
  showDeliveryPolicy = true,
  showReturnsPolicy = true,
  onWhatsApp,
}: StoreContactFooterProps) => {
  const safePhone = cleanValue(phone);

  const safeWhatsApp =
    cleanValue(whatsapp);

  const safeEmail =
    cleanValue(email);

  const safeAddress =
    cleanValue(address);

  const safeServiceArea =
    cleanValue(serviceArea);

  const safeOpeningHours =
    cleanValue(openingHours);

  const socialItems = (
    [
      {
        platform: "instagram",
        label: "Instagram",
        value: cleanValue(instagram),
        url: createSocialUrl(
          "instagram",
          cleanValue(instagram),
        ),
        Icon: Instagram,
      },
      {
        platform: "facebook",
        label: "Facebook",
        value: cleanValue(facebook),
        url: createSocialUrl(
          "facebook",
          cleanValue(facebook),
        ),
        Icon: Facebook,
      },
      {
        platform: "tiktok",
        label: "TikTok",
        value: cleanValue(tiktok),
        url: createSocialUrl(
          "tiktok",
          cleanValue(tiktok),
        ),
        Icon: Music2,
      },
      {
        platform: "linkedin",
        label: "LinkedIn",
        value: cleanValue(linkedin),
        url: createSocialUrl(
          "linkedin",
          cleanValue(linkedin),
        ),
        Icon: Linkedin,
      },
      {
        platform: "x",
        label: "X",
        value: cleanValue(x),
        url: createSocialUrl(
          "x",
          cleanValue(x),
        ),
        Icon: AtSign,
      },
      {
        platform: "youtube",
        label: "YouTube",
        value: cleanValue(youtube),
        url: createSocialUrl(
          "youtube",
          cleanValue(youtube),
        ),
        Icon: Youtube,
      },
      {
        platform: "snapchat",
        label: "Snapchat",
        value: cleanValue(snapchat),
        url: createSocialUrl(
          "snapchat",
          cleanValue(snapchat),
        ),
        Icon: Ghost,
      },
    ] satisfies SocialItem[]
  ).filter(
    (item) =>
      Boolean(item.value) &&
      Boolean(item.url),
  );

  const hasContactDetails = Boolean(
    safePhone ||
      safeWhatsApp ||
      safeEmail ||
      safeAddress ||
      safeServiceArea ||
      safeOpeningHours ||
      socialItems.length > 0,
  );

  const legalLinks = [
    {
      label: "Privacy Policy",
      path: `/store/${storeSlug}/privacy`,
      visible: true,
    },
    {
      label: "Terms and Conditions",
      path: `/store/${storeSlug}/terms`,
      visible: true,
    },
    {
      label: "Returns and Refunds",
      path: `/store/${storeSlug}/refunds`,
      visible: showReturnsPolicy,
    },
    {
      label: "Delivery Policy",
      path: `/store/${storeSlug}/delivery`,
      visible: showDeliveryPolicy,
    },
    {
      label: "Cookie Policy",
      path: `/store/${storeSlug}/cookies`,
      visible: true,
    },
  ].filter(
    (item) =>
      item.visible,
  );
    return (
    <>
      <section
        id="store-contact"
        className="scroll-mt-24 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm"
      >
        <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
          <div
            className="flex flex-col justify-between p-7 text-white sm:p-10"
            style={{
              background: `linear-gradient(145deg, ${brandColor}, ${accentColor})`,
            }}
          >
            <div>
              <MessageCircle className="h-10 w-10" />

              <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Contact
              </p>

              <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
                Let&apos;s start a conversation.
              </h2>

              <p className="mt-4 max-w-md leading-7 text-white/80">
                Contact {storeName} directly for enquiries, availability and service information.
              </p>
            </div>

            {safeWhatsApp && (
              <Button
                type="button"
                size="lg"
                className="mt-10 w-full bg-white text-foreground hover:bg-white/90 sm:w-fit"
                onClick={() => {
                  if (onWhatsApp) {
                    onWhatsApp();
                    return;
                  }

                  window.open(
                    `https://wa.me/${normaliseWhatsAppLink(
                      safeWhatsApp,
                    )}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat on WhatsApp
              </Button>
            )}
          </div>

          <div className="p-6 sm:p-9">
            {hasContactDetails ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {safePhone && (
                  <a
                    href={`tel:${normalisePhoneLink(
                      safePhone,
                    )}`}
                    className="group rounded-2xl border border-border/60 bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${brandColor}12`,
                        color: brandColor,
                      }}
                    >
                      <Phone className="h-5 w-5" />
                    </span>

                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Phone
                    </p>

                    <p className="mt-1 break-words font-bold text-foreground">
                      {safePhone}
                    </p>
                  </a>
                )}

                {safeEmail && (
                  <a
                    href={`mailto:${safeEmail}`}
                    className="group rounded-2xl border border-border/60 bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${brandColor}12`,
                        color: brandColor,
                      }}
                    >
                      <Mail className="h-5 w-5" />
                    </span>

                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>

                    <p className="mt-1 break-all font-bold text-foreground">
                      {safeEmail}
                    </p>
                  </a>
                )}

                {(safeAddress ||
                  safeServiceArea) && (
                  <div className="rounded-2xl border border-border/60 bg-background p-5">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${brandColor}12`,
                        color: brandColor,
                      }}
                    >
                      <MapPin className="h-5 w-5" />
                    </span>

                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Location
                    </p>

                    {safeAddress && (
                      <p className="mt-1 font-bold leading-6 text-foreground">
                        {safeAddress}
                      </p>
                    )}

                    {safeServiceArea && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Service area:{" "}
                        {safeServiceArea}
                      </p>
                    )}
                  </div>
                )}

                {safeOpeningHours && (
                  <div className="rounded-2xl border border-border/60 bg-background p-5">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${brandColor}12`,
                        color: brandColor,
                      }}
                    >
                      <Clock3 className="h-5 w-5" />
                    </span>

                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Opening hours
                    </p>

                    <p className="mt-1 whitespace-pre-line font-bold leading-6 text-foreground">
                      {safeOpeningHours}
                    </p>
                  </div>
                )}

                {socialItems.map(
                  ({
                    platform,
                    label,
                    value,
                    url,
                    Icon,
                  }) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-2xl border border-border/60 bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${brandColor}12`,
                          color: brandColor,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>

                      <p className="mt-1 break-all font-bold text-foreground">
                        {displaySocialValue(
                          platform,
                          value,
                        )}
                      </p>
                    </a>
                  ),
                )}

                {safeWhatsApp && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onWhatsApp) {
                        onWhatsApp();
                        return;
                      }

                      window.open(
                        `https://wa.me/${normaliseWhatsAppLink(
                          safeWhatsApp,
                        )}`,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="rounded-2xl border border-border/60 bg-background p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${brandColor}12`,
                        color: brandColor,
                      }}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </span>

                    <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      WhatsApp
                    </p>

                    <p className="mt-1 font-bold text-foreground">
                      {safeWhatsApp}
                    </p>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/20 px-6 text-center">
                <Store className="h-10 w-10 text-muted-foreground" />

                <h3 className="mt-4 text-lg font-black text-foreground">
                  Contact details are being updated
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  The business owner has not published contact information yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
            <footer className="overflow-hidden rounded-t-3xl border border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${storeName} logo`}
                    className="h-11 w-11 rounded-xl object-contain"
                  />
                ) : (
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white"
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

                <div>
                  <p className="font-display text-lg font-black text-foreground">
                    {storeName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Powered commerce and business website
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck
                  className="h-4 w-4"
                  style={{
                    color: brandColor,
                  }}
                />

                Securely hosted on Storvo
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Policies and information
              </p>

              <nav className="mt-4 grid gap-3 sm:grid-cols-2">
                {legalLinks.map(
                  (item) => (
                    <Link
                      key={
                        item.path
                      }
                      to={
                        item.path
                      }
                      className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(
                        "store-contact",
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                        block:
                          "start",
                      });
                  }}
                  className="text-left text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Contact
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              {storeName}. All rights reserved.
            </p>

            {!isPro && (
              <a
                href="https://app.storvo.co"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-foreground"
              >
                <img
                  src={storvoLogo}
                  alt="Storvo"
                  className="h-5 w-auto"
                />

                Create your website with Storvo
              </a>
            )}
          </div>
        </div>
      </footer>
    </>
  );
};

export default StoreContactFooter;