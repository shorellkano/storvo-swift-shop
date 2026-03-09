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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { store_id, business_name, bank_code, account_number, percentage_charge } = await req.json();

    if (!store_id || !business_name || !bank_code || !account_number) {
      return new Response(JSON.stringify({ error: "store_id, business_name, bank_code, and account_number are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate account number format (10 digits)
    if (!/^\d{10}$/.test(account_number)) {
      return new Response(JSON.stringify({ error: "Account number must be 10 digits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the store belongs to this user
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, user_id")
      .eq("id", store_id)
      .single();

    if (storeError || !store || store.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create subaccount on Paystack
    const paystackRes = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name,
        bank_code,
        account_number,
        percentage_charge: percentage_charge ?? 1, // Default 1% platform fee
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return new Response(JSON.stringify({ error: paystackData.message || "Failed to create subaccount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subaccountCode = paystackData.data.subaccount_code;

    // Save subaccount code to the store using service role to bypass RLS
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: updateError } = await adminSupabase
      .from("stores")
      .update({ paystack_subaccount_code: subaccountCode })
      .eq("id", store_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Subaccount created but failed to save. Code: " + subaccountCode }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        subaccount_code: subaccountCode,
        account_name: paystackData.data.account_name,
        bank: paystackData.data.bank,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
