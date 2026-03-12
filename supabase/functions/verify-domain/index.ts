import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, store_id } = await req.json();

    if (!domain || !store_id) {
      return new Response(JSON.stringify({ error: "Missing domain or store_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check CNAME via DNS lookup (using Google DNS-over-HTTPS)
    let verified = false;
    try {
      const dnsRes = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`
      );
      const dnsData = await dnsRes.json();

      if (dnsData.Answer) {
        verified = dnsData.Answer.some(
          (record: { data: string }) =>
            record.data?.replace(/\.$/, "").toLowerCase() === "stores.storvo.co"
        );
      }

      // Also check A/AAAA records if CNAME not found (root domains use A records)
      if (!verified) {
        const aRes = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`
        );
        const aData = await aRes.json();
        // For root domains, we accept if they have any DNS pointing to us
        // In production this would check against our actual IP
        if (aData.Answer && aData.Answer.length > 0) {
          // For now, we'll verify CNAME only
        }
      }
    } catch (dnsErr) {
      console.error("DNS lookup error:", dnsErr);
    }

    // Update domain status in database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (verified) {
      await supabaseAdmin
        .from("custom_domains")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("domain", domain)
        .eq("store_id", store_id);
    }

    return new Response(JSON.stringify({ verified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
