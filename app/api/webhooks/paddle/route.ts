import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

// Map your Paddle Price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  "pri_01m1w3frfzzynbj41ham3tevz9": "starter",
  "pri_01m1w3n6sztejvpmvw5jwets9x": "starter",
  "pri_01m1w45z6yfh7b3j7t2ej2zn01": "pro",
  "pri_01m1w48nwjqb3rb67cfat5psq2": "pro",
  "pri_01m1w4dcnwd7jchtrvbem36tf5": "advanced",
  "pri_01m1w4gwxmpnc3wv75g05ajpg5": "advanced",
};

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("="))
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const expected = crypto
    .createHmac("sha256", PADDLE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type;
  const data = event.data;

  try {
    if (
      eventType === "subscription.created" ||
      eventType === "subscription.updated"
    ) {
      const supabaseUserId = data.custom_data?.supabase_user_id;
      const priceId = data.items?.[0]?.price?.id;
      const plan = priceId ? PRICE_TO_PLAN[priceId] || "free" : "free";

      if (supabaseUserId) {
        await supabaseAdmin
          .from("profiles")
          .update({
            plan,
            paddle_customer_id: data.customer_id,
            paddle_subscription_id: data.id,
            subscription_status: data.status,
            current_period_end: data.current_billing_period?.ends_at || null,
          })
          .eq("id", supabaseUserId);

        const planPriorityMap: Record<string, number> = {
          advanced: 3,
          pro: 2,
          starter: 1,
        };
        const newPriority = planPriorityMap[plan?.toLowerCase()] || 0;

        await supabaseAdmin
          .from("doctors")
          .update({ plan_priority: newPriority })
          .eq("claimed_by", supabaseUserId);
      }
    }

    if (eventType === "subscription.canceled") {
      const supabaseUserId = data.custom_data?.supabase_user_id;
      if (supabaseUserId) {
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
          })
          .eq("id", supabaseUserId);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}