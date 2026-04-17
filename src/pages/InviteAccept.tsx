import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Store, AlertCircle, Clock } from "lucide-react";
import storvoLogo from "@/assets/storvo-logo.png";
import { ROLE_LABELS, ROLE_COLORS, type TeamRole } from "@/lib/teamPermissions";

interface Invitation {
  id: string;
  store_id: string;
  email: string;
  role: TeamRole;
  status: string;
  expires_at: string;
  token: string;
}

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Invalid invitation link."); setLoading(false); return; }
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    const { data: inv, error: invErr } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("token", token!)
      .maybeSingle();

    if (invErr || !inv) {
      setError("Invitation not found or the link is invalid.");
      setLoading(false);
      return;
    }

    if (inv.status !== "pending") {
      setError(
        inv.status === "accepted"
          ? "This invitation has already been accepted."
          : "This invitation has been cancelled or has expired."
      );
      setLoading(false);
      return;
    }

    if (new Date(inv.expires_at) < new Date()) {
      setError("This invitation has expired.");
      setLoading(false);
      return;
    }

    setInvitation(inv as Invitation);

    const { data: store } = await supabase
      .from("stores")
      .select("id, name, slug, logo_url")
      .eq("id", inv.store_id)
      .maybeSingle();

    if (store) setStoreInfo(store as StoreInfo);
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!user || !invitation || !storeInfo) return;

    setAccepting(true);
    try {
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          store_id: invitation.store_id,
          user_id: user.id,
          email: user.email || invitation.email,
          role: invitation.role,
          invited_by: invitation.invited_by ?? null,
        });

      if (memberError) {
        if (memberError.code === "23505") {
          toast.error("You are already a member of this store.");
          setAccepting(false);
          return;
        }
        throw memberError;
      }

      await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      setAccepted(true);
      toast.success("You have joined the team.");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={storvoLogo} alt="Storvo" className="h-10 w-auto" />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
          {error ? (
            <>
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Invalid Invitation</h1>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Go to Storvo
              </Button>
            </>
          ) : accepted ? (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Welcome to the team!</h1>
              <p className="text-sm text-muted-foreground mb-2">
                You have joined <strong>{storeInfo?.name}</strong> as{" "}
                <strong>{ROLE_LABELS[invitation!.role]}</strong>.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="w-full mt-6">
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              {storeInfo?.logo_url ? (
                <img
                  src={storeInfo.logo_url}
                  alt={storeInfo.name}
                  className="h-14 w-14 rounded-xl object-cover mx-auto mb-4 border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Store className="h-7 w-7 text-primary" />
                </div>
              )}

              <h1 className="text-xl font-bold text-foreground mb-1">
                You have been invited
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                You are invited to join{" "}
                <strong className="text-foreground">{storeInfo?.name || "a store"}</strong> on Storvo.
              </p>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Your role:</span>
                <Badge
                  variant="outline"
                  className={`text-sm ${ROLE_COLORS[invitation!.role]}`}
                >
                  {ROLE_LABELS[invitation!.role]}
                </Badge>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Expires {new Date(invitation!.expires_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {user ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Accepting as <strong>{user.email}</strong>
                  </p>
                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full"
                    data-testid="button-accept-invite"
                  >
                    {accepting ? "Accepting..." : "Accept Invitation"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in or create an account to accept this invitation.
                  </p>
                  <Button
                    onClick={() => navigate(`/auth?redirect=/invite/${token}`)}
                    className="w-full"
                    data-testid="button-sign-in-invite"
                  >
                    Sign in to Accept
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteAccept;
