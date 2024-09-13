import Stripe from "stripe";

import type { DBType } from "@socketless/db/client";
import { eq } from "@socketless/db";
import { projectTable } from "@socketless/db/schema";

import { env } from "../../env";
import { getProject, getProjectWithOwner } from "./project";

export async function createStripeCustomer(
  db: DBType,
  projectId: number,
  updateDatabase = true,
) {
  if (env.STRIPE_SECRET_KEY === undefined) {
    throw new Error("Stripe not supported");
  }

  const project = await getProjectWithOwner(db, projectId);

  if (project === undefined) {
    throw new Error("Project not found");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const customer = await stripe.customers.create({
    metadata: {
      project: project.project.id,
      userId: project.user.id,
    },
    email: project.user.email,
  });

  if (updateDatabase) {
    await db
      .update(projectTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(projectTable.id, projectId));
  }

  return customer;
}

export async function generatePaidPlanCheckout(db: DBType, projectId: number) {
  if (env.STRIPE_SECRET_KEY === undefined) {
    throw new Error("Stripe not supported");
  }

  const project = await getProject(db, projectId);

  if (project === undefined) {
    throw new Error("Project not found");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  let stripeCustomerId = project.stripeCustomerId;

  if (stripeCustomerId === null) {
    const stripecustomer = await createStripeCustomer(db, projectId);
    stripeCustomerId = stripecustomer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: "price_1PyhA6I6N2RqkxaVzR4iNNu8",
        // For metered billing, do not pass quantity
        quantity: 1,
      },
    ],
    customer: stripeCustomerId,
    // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
    // the actual Session ID is returned in the query parameter when your customer
    // is redirected to the success page.
    cancel_url: `https://app.socketless.ws/${project.id}/billing?return=cancel`,
    success_url: `https://app.socketless.ws/${project.id}/billing?return=success?stripeid={CHECKOUT_SESSION_ID}`,
  });

  if (session.url !== null) {
    return session.url;
  }
}

export async function generateStripeBillingManagementLink(
  db: DBType,
  projectId: number,
) {
  if (env.STRIPE_SECRET_KEY === undefined) {
    throw new Error("Stripe not supported");
  }

  const project = await getProject(db, projectId);

  if (project === undefined) {
    throw new Error("Project not found");
  }

  if (project.stripeCustomerId === null) {
    throw new Error("No customer ID");
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const session = await stripe.billingPortal.sessions.create({
    customer: project.stripeCustomerId,
    return_url: `https://app.socketless.ws/${project.id}/billing`,
  });

  return session.url;
}
