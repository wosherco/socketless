import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";

import { Button } from "@socketless/ui/button";

import { env } from "~/env";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function Page({
  params,
}: {
  params: { projectId: string };
}) {
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  const project = await api.project.getProject({ projectId: parsedProjectId });

  return (
    <>
      <h1 className="text-xl font-medium">Billing</h1>
      <h2 className="text-sm text-muted-foreground">
        Manage your current Socketless Plan right here. You can also take a look
        at past invoices.
      </h2>

      <div className="my-4">
        <p>
          Currently upgrading is only available manually. Please, contact with
          sales if you're interested on upgrading:{" "}
          <a
            href="mailto:sales@socketless.ws"
            className="underline"
            target="_blank"
          >
            sales@socketless.ws
          </a>
        </p>
      </div>
      {/* <form
        action={async () => {
          "use server";

          const stripe = new Stripe(env.STRIPE_SECRET_KEY);

          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: project.customerId,
            line_items: [
              {
                price: "price_1PSEtmI6N2RqkxaVUw3B2q6u",
                quantity: 1,
              },
              // {
              //   price: "price_1PSEugI6N2RqkxaVGvnuo0Gv",
              //   quantity: 0,
              // }
            ],
            cancel_url: `https://socketless.ws/dashboard/${parsedProjectId}/billing?return=cancel`,
            success_url: `https://socketless.ws/dashboard/${parsedProjectId}/billing?return=success?stripeid={CHECKOUT_SESSION_ID}`,
          });

          if (session.url !== null) {
            redirect(session.url);
          }
        }}
      >
        <Button>Become Paid</Button>
      </form> */}

      <form
        action={async () => {
          "use server";

          const stripe = new Stripe(env.STRIPE_SECRET_KEY);

          const session = await stripe.billingPortal.sessions.create({
            customer: project.customerId,
            return_url: `https://socketless.ws/dashboard/${parsedProjectId}/billing`,
          });

          redirect(session.url);
        }}
      >
        <Button>Manage Billing</Button>
      </form>
    </>
  );
}
