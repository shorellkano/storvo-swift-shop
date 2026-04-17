import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.224.0/crypto/mod.ts";

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
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response("Not configured", { status: 500 });
    }

    const body = await req.text();

    // Verify Paystack signature
    const signature = req.headers.get("x-paystack-signature");
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(PAYSTACK_SECRET_KEY),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const hash = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (hash !== signature) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200 });
    }

    const { metadata, reference } = event.data;
    if (!metadata || metadata.type !== "subscription" || metadata.plan !== "pro") {
      return new Response("OK", { status: 200 });
    }

    const storeId = metadata.store_id;

    // Use service role to update subscription
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Upsert subscription
    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          store_id: storeId,
          plan: "pro",
          is_active: true,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "store_id" }
      );

    if (error) {
      console.error("Failed to update subscription:", error);
      return new Response("DB error", { status: 500 });
    }

    console.log(`Pro subscription activated for store ${storeId}, ref: ${reference}`);

    // --- Affiliate Commission Logic ---
    try {
      // Get store's owner user_id
      const { data: storeRow } = await supabase
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .maybeSingle();

      if (storeRow?.user_id) {
        const userId = storeRow.user_id;

        // Find affiliate referral for this seller
        const { data: referral } = await supabase
          .from("affiliate_referrals")
          .select("id, affiliate_id, signup_date")
          .eq("referred_user_id", userId)
          .maybeSingle();

        if (referral && referral.affiliate_id) {
          // Check within 12-month commission window
          const signupDate = new Date(referral.signup_date);
          const windowEnd = new Date(signupDate);
          windowEnd.setFullYear(windowEnd.getFullYear() + 1);

          if (now <= windowEnd) {
            // Get affiliate commission rate
            const { data: affiliate } = await supabase
              .from("affiliates")
              .select("commission_rate")
              .eq("id", referral.affiliate_id)
              .maybeSingle();

            const commissionRate = affiliate?.commission_rate ?? 30;
            const subscriptionFee = 3500;
            const commissionAmount = Math.round((subscriptionFee * commissionRate) / 100);

            // Period month = first day of current month
            const periodMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

            // Insert commission (UNIQUE on referral_id + period_month prevents duplicates)
            const { error: commissionErr } = await supabase
              .from("affiliate_commissions")
              .insert({
                affiliate_id: referral.affiliate_id,
                referral_id: referral.id,
                seller_id: userId,
                subscription_store_id: storeId,
                commission_amount: commissionAmount,
                period_month: periodMonth,
                status: "pending",
              });

            if (!commissionErr) {
              // Mark referral as converted to Pro (if not already)
              await supabase
                .from("affiliate_referrals")
                .update({ converted_to_pro: true, converted_at: now.toISOString() })
                .eq("id", referral.id)
                .is("converted_at", null);

              console.log(`Affiliate commission of ₦${commissionAmount} recorded for affiliate ${referral.affiliate_id}`);
            } else if (!commissionErr.message?.includes("unique")) {
              console.error("Commission insert error:", commissionErr.message);
            }
          }
        }
      }
    } catch (commErr) {
      // Commission errors must not fail the main subscription webhook
      console.error("Affiliate commission error:", commErr);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});
