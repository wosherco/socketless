import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Pricing from "@socketless/components/pricing";
import { Button } from "@socketless/ui/button";

import { manageBilling, upgradePlan } from "~/actions/StripeActions";
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
  if (env.STRIPE_SECRET_KEY === undefined) {
    notFound();
  }

  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  const project = await api.project.getProject({ projectId: parsedProjectId });

  const manageBillingAction = manageBilling.bind(null, project.id);
  const upgradePlanAction = upgradePlan.bind(null, project.id);

  const manageBillingButton = (
    <form action={manageBillingAction}>
      <Button>Manage Billing</Button>
    </form>
  );

  const contactButton = <Button>Contact Sales</Button>;

  const currentPlan = <Button disabled>Your current plan</Button>;

  const upgradeButton = (
    <form action={upgradePlanAction}>
      <Button>Upgrade</Button>
    </form>
  );

  return (
    <>
      <h1 className="text-xl font-medium">Billing</h1>
      <h2 className="text-sm text-muted-foreground">
        Manage your current Socketless Plan right here. You can also take a look
        at past invoices.
      </h2>

      <div className="my-4">
        <Pricing
          FreePlanFooter={
            project.plan === "CUSTOM"
              ? contactButton
              : project.plan === "FREE"
                ? currentPlan
                : manageBillingButton
          }
          LaunchPlanFooter={
            project.plan === "CUSTOM"
              ? contactButton
              : project.plan === "PAID"
                ? currentPlan
                : upgradeButton
          }
          EnterprisePlanFooter={
            project.plan === "CUSTOM" ? currentPlan : contactButton
          }
        />
      </div>

      {manageBillingButton}
    </>
  );
}
