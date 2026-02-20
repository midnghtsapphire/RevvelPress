import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { getStripe } from "./stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerStripeWebhook(app: Express) {
  // Must be registered BEFORE express.json() middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          ENV.stripeWebhookSecret
        );
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id || "0");
            if (userId && session.customer) {
              const db = await getDb();
              if (db) {
                await db.update(users)
                  .set({
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionTier: "starter",
                  })
                  .where(eq(users.id, userId));
              }
            }
            break;
          }
          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            console.log(`[Webhook] Subscription ${sub.id} updated, status: ${sub.status}`);
            break;
          }
          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (db) {
              await db.update(users)
                .set({
                  subscriptionTier: "free",
                  stripeSubscriptionId: null,
                  monthlyTokenAllowance: 50,
                })
                .where(eq(users.stripeCustomerId, sub.customer as string));
            }
            break;
          }
          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`[Webhook] Payment failed for invoice ${invoice.id}`);
            // Grace period logic - don't immediately downgrade
            break;
          }
        }
      } catch (err) {
        console.error("[Stripe Webhook] Processing error:", err);
      }

      res.json({ received: true });
    }
  );
}
