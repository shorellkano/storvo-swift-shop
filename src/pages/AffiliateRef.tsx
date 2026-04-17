import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import storvoLogo from "@/assets/storvo-logo.png";

const AffiliateRef = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "not_found">("loading");

  useEffect(() => {
    if (!username) { navigate("/auth?mode=signup", { replace: true }); return; }

    const handleRef = async () => {
      const slug = username.toLowerCase().trim();

      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id, username, status")
        .eq("username", slug)
        .eq("status", "active")
        .maybeSingle();

      if (!affiliate) {
        setStatus("not_found");
        setTimeout(() => navigate("/auth?mode=signup", { replace: true }), 2500);
        return;
      }

      // Record click (fire-and-forget)
      supabase.from("affiliate_clicks").insert({ affiliate_id: affiliate.id } as any).then(() => {});

      // Set referral cookie - 30 days
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `storvo_ref=${slug}; max-age=${maxAge}; path=/; SameSite=Lax`;

      // Also store in sessionStorage as fallback
      sessionStorage.setItem("storvo_ref", slug);

      // Redirect to signup with ref param
      navigate(`/auth?mode=signup&ref=${slug}`, { replace: true });
    };

    handleRef();
  }, [username, navigate]);

  if (status === "not_found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <img src={storvoLogo} alt="Storvo" className="h-8 mb-2" />
        <p className="text-muted-foreground text-sm">Referral link not found. Redirecting to signup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
      <img src={storvoLogo} alt="Storvo" className="h-8 mb-2" />
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-muted-foreground text-sm">Loading your special link...</p>
    </div>
  );
};

export default AffiliateRef;
