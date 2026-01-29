import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, username, role } = await req.json();

    // Validate required fields
    if (!email || !password || !username || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, username, role" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Create user in auth
    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    if (user) {
      // Create profile
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        user_id: user.id,
        username,
        full_name,
      });
      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: user.id,
        role,
      });
      if (roleError) throw roleError;
    }

    return new Response(
      JSON.stringify({ success: true, user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    console.error("Create user error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred while creating the user"
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
