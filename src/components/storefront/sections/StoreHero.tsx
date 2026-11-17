import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type StoreHeroProps = {
  storeName: string;
  description?: string | null;
  logoUrl?: string | null;
  heroImage?: string | null;
  brandColor: string;
  accentColor: string;
  headline: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  featuredLabel?: string;
  featuredText?: string;
  storefrontType: "product" | "service";
  eyebrowLabel?: string;
  trustPoints?: string[];
  onShopNow: () => void;
  onBrowseCategories: () => void;
};

const StoreHero = ({
  storeName,
  description,
  logoUrl,
  heroImage,
  brandColor,
  accentColor,
  headline,
  primaryCtaLabel,
  secondaryCtaLabel,
  featuredLabel,
  featuredText,
  storefrontType,
  eyebrowLabel,
  trustPoints = [],
  onShopNow,
  onBrowseCategories,
}: StoreHeroProps) => {
  const isServiceStore =
    storefrontType === "service";

  const HeroIcon = isServiceStore
    ? BriefcaseBusiness
    : ShoppingBag;

  return (
    <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${storeName} logo`}
                className="h-12 w-12 rounded-2xl object-contain"
              />
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white"
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

            <div className="min-w-0">
              {eyebrowLabel && (
                <p
                  className="text-xs font-black uppercase tracking-[0.18em]"
                  style={{
                    color: brandColor,
                  }}
                >
                  {eyebrowLabel}
                </p>
              )}

              <p className="truncate text-sm font-bold text-muted-foreground">
                {storeName}
              </p>
            </div>
          </div>

          <h1 className="mt-7 max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {headline}
          </h1>

          {description && (
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={onShopNow}
              className="font-bold text-white"
              style={{
                backgroundColor:
                  brandColor,
              }}
            >
              {primaryCtaLabel}

              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={
                onBrowseCategories
              }
              className="font-bold"
            >
              {secondaryCtaLabel}
            </Button>
          </div>

          {trustPoints.length > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustPoints
                .slice(0, 4)
                .map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-2.5"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{
                        color:
                          brandColor,
                      }}
                    />

                    <span className="text-sm font-semibold leading-6 text-muted-foreground">
                      {point}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div
          className="relative min-h-[340px] overflow-hidden sm:min-h-[420px]"
          style={{
            background: `linear-gradient(145deg, ${brandColor}, ${accentColor})`,
          }}
        >
          {heroImage ? (
            <>
              <img
                src={heroImage}
                alt={storeName}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </>
          ) : (
            <>
              <div
                className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20"
                style={{
                  backgroundColor:
                    "#ffffff",
                }}
              />

              <div
                className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-10"
                style={{
                  backgroundColor:
                    "#ffffff",
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/15 backdrop-blur-sm">
                  <HeroIcon className="h-14 w-14 text-white" />
                </div>
              </div>
            </>
          )}

          {(featuredLabel ||
            featuredText) && (
            <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
              <div className="max-w-sm rounded-2xl border border-white/20 bg-black/30 p-5 text-white backdrop-blur-md">
                <Sparkles className="h-5 w-5" />

                {featuredLabel && (
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-white/70">
                    {featuredLabel}
                  </p>
                )}

                {featuredText && (
                  <p className="mt-2 font-display text-xl font-black leading-tight">
                    {featuredText}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoreHero;