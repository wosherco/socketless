import * as Sentry from "@sentry/nextjs";
import Stripe from "stripe";

import { FreePlanLimits, PaidPlanLimits } from "@socketless/api/utils";
import { eq } from "@socketless/db";
import { db } from "@socketless/db/client";
import { projectTable } from "@socketless/db/schema";

import { env } from "../../../../env";

export async function POST(req: Request) {
  if (
    env.STRIPE_WEBHOOK_SECRET === undefined ||
    env.STRIPE_SECRET_KEY === undefined
  ) {
    throw new Error("Stripe webhook secret is not set");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  // Check if webhook signing is configured.
  let event;
  const signature = req.headers.get("stripe-signature");

  if (signature === null) {
    return new Response("⚠️  Webhook signature required.", { status: 400 });
  }

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    Sentry.captureException(err);
    return new Response(`⚠️  Webhook signature verification failed`, {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed":
      {
        const customerId = event.data.object.customer as string;
        const subscriptionId = event.data.object.subscription as string;

        await db
          .update(projectTable)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripePlan: "PAID",

            concurrentConnectionsLimit:
              PaidPlanLimits.concurrentConnectionsLimit,
            incomingMessagesLimit: PaidPlanLimits.incomingMessagesLimit,
            outgoingMessagesLimit: PaidPlanLimits.outgoingMessagesLimit,
          })
          .where(eq(projectTable.stripeCustomerId, customerId));

        // TODO: Send email to customer
      }
      break;
    case "invoice.paid":
      // TODO: Send email to customer
      // Continue to provision the subscription as payments continue to be made.
      // Store the status in your database and check when a user accesses your service.
      // This approach helps you avoid hitting rate limits.
      break;
    case "invoice.payment_failed":
      // TODO: Send email to customer
      // The payment failed or the customer does not have a valid payment method.
      // The subscription becomes past_due. Notify your customer and send them to the
      // customer portal to update their payment information.
      break;
    case "customer.subscription.deleted":
      {
        const customerId = event.data.object.customer as string;

        await db
          .update(projectTable)
          .set({
            stripeSubscriptionId: null,
            stripePlan: "FREE",

            concurrentConnectionsLimit:
              FreePlanLimits.concurrentConnectionsLimit,
            incomingMessagesLimit: FreePlanLimits.incomingMessagesLimit,
            outgoingMessagesLimit: FreePlanLimits.outgoingMessagesLimit,
          })
          .where(eq(projectTable.stripeCustomerId, customerId));
        // TODO: Send email to customer
      }
      break;
    default:
    // Unhandled event type
  }

  return new Response("Success", { status: 200 });
}
