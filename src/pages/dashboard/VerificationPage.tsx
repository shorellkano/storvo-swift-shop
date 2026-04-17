import { useEffect, useState, useRef } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BadgeCheck,
  Clock,
  XCircle,
  Info,
  Upload,
  FileText,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";

type VerificationStatus = "none" | "pending" | "verified" | "rejected" | "info_requested";

interface VerificationApplication {
  id: string;
  status: VerificationStatus;
  full_legal_name: string;
  phone_number: string;
  business_name?: string | null;
  id_document_url?: string | null;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  admin_notes?: string | null;
  submitted_at: string;
}

const REQUIREMENTS = [
  "Full legal name",
  "Government-issued ID (passport, national ID, or driver's licence)",
  "Phone number",
  "Bank account details (name, number, bank)",
  "Business name (optional)",
];

const statusConfig: Record<VerificationStatus, {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}> = {
  none: {
    icon: Shield,
    label: "Not Verified",
    description: "Apply for verification to display the Verified Seller badge on your storefront.",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
  pending: {
    icon: Clock,
    label: "Verification Pending",
    description: "Your application has been submitted and is under review. We will notify you once a decision has been made.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  verified: {
    icon: BadgeCheck,
    label: "Verified",
    description: "You are a Verified Seller. Your badge is live on your storefront and product pages.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  rejected: {
    icon: XCircle,
    label: "Application Rejected",
    description: "Your verification application was not approved. You may submit a new application.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  info_requested: {
    icon: Info,
    label: "Additional Information Required",
    description: "Storvo has reviewed your application and needs more information. Please update and resubmit.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
  },
};

const VerificationPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { store, role, loading: storeLoading } = useStore();

  const [application, setApplication] = useState<VerificationApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullLegalName, setFullLegalName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    loadData();
  }, [store?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: appData } = await supabase
        .from("verification_applications")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (appData) {
        setApplication(appData as VerificationApplication);
        if (appData.status === "info_requested") {
          setFullLegalName(appData.full_legal_name || "");
          setPhoneNumber(appData.phone_number || "");
          setBusinessName(appData.business_name || "");
          setBankAccountName(appData.bank_account_name || "");
          setBankAccountNumber(appData.bank_account_number || "");
          setBankName(appData.bank_name || "");
          setDocumentUrl(appData.id_document_url || null);
        }
      }
    } catch (err) {
      console.error("Failed to load verification data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/id-document-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("verification-documents")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(path);

      setDocumentUrl(urlData.publicUrl);
      setDocumentName(file.name);
      toast.success("Document uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !user) return;

    if (!fullLegalName.trim()) { toast.error("Please enter your full legal name."); return; }
    if (!phoneNumber.trim()) { toast.error("Please enter your phone number."); return; }
    if (!bankAccountName.trim()) { toast.error("Please enter your bank account name."); return; }
    if (!bankAccountNumber.trim()) { toast.error("Please enter your bank account number."); return; }
    if (!bankName.trim()) { toast.error("Please enter your bank name."); return; }

    setSubmitting(true);
    try {
      const payload = {
        store_id: store.id,
        user_id: user.id,
        status: "pending" as const,
        full_legal_name: fullLegalName.trim(),
        phone_number: phoneNumber.trim(),
        business_name: businessName.trim() || null,
        id_document_url: documentUrl,
        bank_account_name: bankAccountName.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_name: bankName.trim(),
        submitted_at: new Date().toISOString(),
      };

      if (application && application.status === "info_requested") {
        const { error } = await supabase
          .from("verification_applications")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", application.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("verification_applications")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Verification application submitted! We will review it shortly.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const showForm =
    !loading &&
    application?.status !== "verified" &&
    application?.status !== "pending";

  const currentStatus: VerificationStatus = store?.is_verified
    ? "verified"
    : (application?.status as VerificationStatus) || "none";

  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar store={store} role={role} />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-4 border-b border-border/40 px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Settings</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Verification</span>
            </div>
          </header>

          <main className="mx-auto w-full max-w-2xl space-y-6 px-6 py-8">

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Status Banner */}
                <div className={`rounded-xl border ${config.border} ${config.bg} p-5`}>
                  <div className="flex items-start gap-4">
                    <StatusIcon className={`mt-0.5 h-6 w-6 shrink-0 ${config.color}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${config.color}`}>
                        Verification Status: {config.label}
                        {currentStatus === "verified" && " ✔"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
                      {application?.admin_notes && (
                        <div className="mt-3 rounded-lg bg-background/60 border border-border/60 p-3">
                          <p className="text-xs font-medium text-foreground">Note from Storvo:</p>
                          <p className="mt-1 text-xs text-muted-foreground">{application.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requirements info */}
                {currentStatus !== "verified" && (
                  <Card className="border-border/60 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Become a Verified Seller
                      </CardTitle>
                      <CardDescription>
                        Increase customer trust and credibility. The Verified Seller badge appears on your storefront and all product pages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Requirements
                      </p>
                      <ul className="space-y-2">
                        {REQUIREMENTS.map((req) => (
                          <li key={req} className="flex items-center gap-2.5 text-sm text-foreground">
                            <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Application Form */}
                {showForm && (
                  <Card className="border-border/60 shadow-card">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">
                        {application?.status === "info_requested"
                          ? "Update Your Application"
                          : "Submit Verification Application"}
                      </CardTitle>
                      <CardDescription>
                        All information is kept secure and only accessible to Storvo administrators.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Label htmlFor="fullLegalName">Full Legal Name *</Label>
                            <Input
                              id="fullLegalName"
                              value={fullLegalName}
                              onChange={(e) => setFullLegalName(e.target.value)}
                              placeholder="As it appears on your ID"
                              required
                              data-testid="input-full-legal-name"
                            />
                          </div>

                          <div>
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <Input
                              id="phoneNumber"
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+234 800 000 0000"
                              required
                              data-testid="input-phone-number"
                            />
                          </div>

                          <div>
                            <Label htmlFor="businessName">Business Name <span className="text-muted-foreground">(optional)</span></Label>
                            <Input
                              id="businessName"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              placeholder="Registered business name"
                              data-testid="input-business-name"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Account Details</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="bankName">Bank Name *</Label>
                              <Input
                                id="bankName"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. First Bank"
                                required
                                data-testid="input-bank-name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bankAccountNumber">Account Number *</Label>
                              <Input
                                id="bankAccountNumber"
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="10-digit account number"
                                maxLength={10}
                                required
                                data-testid="input-bank-account-number"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Label htmlFor="bankAccountName">Account Name *</Label>
                              <Input
                                id="bankAccountName"
                                value={bankAccountName}
                                onChange={(e) => setBankAccountName(e.target.value)}
                                placeholder="Name on the bank account"
                                required
                                data-testid="input-bank-account-name"
                              />
                            </div>
                          </div>
                        </div>

                        {/* ID Document Upload */}
                        <div>
                          <Label>Government ID Document</Label>
                          <p className="mt-0.5 text-xs text-muted-foreground mb-2">
                            Accepted: JPG, PNG, PDF (max 10 MB). Passport, National ID, or Driver's Licence.
                          </p>
                          <div
                            className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                              </>
                            ) : documentName ? (
                              <>
                                <FileText className="h-8 w-8 text-blue-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{documentName}</p>
                                  <p className="text-xs text-blue-600 mt-0.5">Click to replace</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Click to upload your ID</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or PDF up to 10 MB</p>
                                </div>
                              </>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={handleFileUpload}
                              data-testid="input-id-document"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="hero"
                          size="lg"
                          className="w-full"
                          disabled={submitting || uploading}
                          data-testid="button-submit-verification"
                        >
                          {submitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                          ) : (
                            <><Shield className="mr-2 h-4 w-4" /> Submit Verification Application</>
                          )}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                          Sensitive identity data is protected and only accessible to Storvo administrators.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Pending - no form needed */}
                {application?.status === "pending" && (
                  <div className="rounded-xl border border-border/60 bg-card p-5 text-center">
                    <Clock className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                    <p className="font-display font-semibold text-foreground">Application Under Review</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Submitted on {new Date(application.submitted_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. We review applications within 1-3 business days.
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VerificationPage;
