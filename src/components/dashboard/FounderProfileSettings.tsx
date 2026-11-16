import {
  Camera,
  Link2,
  Loader2,
  LockKeyhole,
  Quote,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FounderProfile = {
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

type FounderProfileSettingsProps = {
  isPro: boolean;
  founder: FounderProfile;
  uploadingFounderImage: boolean;

  onUpdate: <K extends keyof FounderProfile>(
    key: K,
    value: FounderProfile[K],
  ) => void;

  onChooseImage: () => void;
  onClearImage: () => void;
  onUpgrade: () => void;
};

const FounderProfileSettings = ({
  isPro,
  founder,
  uploadingFounderImage,
  onUpdate,
  onChooseImage,
  onClearImage,
  onUpgrade,
}: FounderProfileSettingsProps) => {
  if (!isPro) {
    return (
      <Card className="overflow-hidden border-primary/20 shadow-card">
        <CardHeader className="bg-gradient-to-br from-primary/5 via-background to-accent/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserRound className="h-5 w-5 text-primary" />
                  Founder or Leadership Profile
                </CardTitle>

                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  Pro
                </span>
              </div>

              <CardDescription className="mt-2 max-w-2xl">
                Add a professional founder, CEO or leadership profile with a
                photo, biography, quote and profile link.
              </CardDescription>
            </div>

            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <Camera className="h-5 w-5 text-primary" />

              <p className="mt-3 font-semibold text-foreground">
                Build personal trust
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Introduce the person behind the business with a professional
                image.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <Quote className="h-5 w-5 text-primary" />

              <p className="mt-3 font-semibold text-foreground">
                Share your story
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add a short biography, role and personal brand message.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <Link2 className="h-5 w-5 text-primary" />

              <p className="mt-3 font-semibold text-foreground">
                Strengthen credibility
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Link visitors to a LinkedIn page or professional profile.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="mt-5"
            onClick={onUpgrade}
          >
            <LockKeyhole className="mr-2 h-4 w-4" />
            Unlock with Storvo Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-primary" />
              Founder or Leadership Profile
            </CardTitle>

            <CardDescription>
              Add an optional trust-building section about the founder, CEO or
              lead professional.
            </CardDescription>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={founder.enabled}
              onChange={(event) =>
                onUpdate("enabled", event.target.checked)
              }
            />
            Show section
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {founder.enabled && (
          <>
            <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
              <div>
                <button
                  type="button"
                  onClick={onChooseImage}
                  className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30 transition hover:border-primary"
                >
                  {founder.imageUrl ? (
                    <img
                      src={founder.imageUrl}
                      alt="Founder or leader"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-12 w-12 text-muted-foreground" />
                  )}

                  {uploadingFounderImage && (
                    <span className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </span>
                  )}
                </button>

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onChooseImage}
                    disabled={uploadingFounderImage}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />

                    {founder.imageUrl
                      ? "Replace"
                      : "Upload"}
                  </Button>

                  {founder.imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onClearImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="founderSectionLabel">
                    Section heading
                  </Label>

                  <Input
                    id="founderSectionLabel"
                    value={founder.sectionLabel}
                    onChange={(event) =>
                      onUpdate(
                        "sectionLabel",
                        event.target.value,
                      )
                    }
                    placeholder="Meet the Founder"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="founderName">
                      Name
                    </Label>

                    <Input
                      id="founderName"
                      value={founder.name}
                      onChange={(event) =>
                        onUpdate(
                          "name",
                          event.target.value,
                        )
                      }
                      placeholder="Full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founderRole">
                      Role or title
                    </Label>

                    <Input
                      id="founderRole"
                      value={founder.role}
                      onChange={(event) =>
                        onUpdate(
                          "role",
                          event.target.value,
                        )
                      }
                      placeholder="Founder and Creative Director"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="founderBiography">
                Short biography
              </Label>

              <Textarea
                id="founderBiography"
                value={founder.biography}
                onChange={(event) =>
                  onUpdate(
                    "biography",
                    event.target.value,
                  )
                }
                rows={5}
                placeholder="Introduce the person behind the brand and explain their experience, values and approach."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="founderQuote">
                Optional quote
              </Label>

              <div className="relative">
                <Quote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Textarea
                  id="founderQuote"
                  value={founder.quote}
                  onChange={(event) =>
                    onUpdate(
                      "quote",
                      event.target.value,
                    )
                  }
                  rows={3}
                  className="pl-10"
                  placeholder="A short personal message or brand belief."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="founderProfileUrl">
                  LinkedIn or profile link
                </Label>

                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="founderProfileUrl"
                    value={founder.profileUrl}
                    onChange={(event) =>
                      onUpdate(
                        "profileUrl",
                        event.target.value,
                      )
                    }
                    className="pl-10"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="founderButtonText">
                  Button text
                </Label>

                <Input
                  id="founderButtonText"
                  value={founder.buttonText}
                  onChange={(event) =>
                    onUpdate(
                      "buttonText",
                      event.target.value,
                    )
                  }
                  placeholder="Learn more"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your founder details are kept as a draft while you work. The
              section appears on the storefront when it is enabled and has a
              name, biography or profile image.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FounderProfileSettings;