import Stripe from "stripe";
import { ENV } from "../_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-02-24.acacia" as any });
  }
  return _stripe;
}

export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  priceId: string;
  origin: string;
  successPath?: string;
  cancelPath?: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.userEmail,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
    },
    allow_promotion_codes: true,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: `${params.origin}${params.successPath || "/dashboard?payment=success"}`,
    cancel_url: `${params.origin}${params.cancelPath || "/pricing?payment=cancelled"}`,
  });
  return session;
}

export async function createCustomerPortalSession(customerId: string, origin: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });
}
