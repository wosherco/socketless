import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";

export default function Pricing({
  FreePlanFooter,
  LaunchPlanFooter,
  EnterprisePlanFooter,
}: {
  FreePlanFooter?: React.ReactNode;
  LaunchPlanFooter?: React.ReactNode;
  EnterprisePlanFooter?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-around gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>
            Try us for free, no strings attached.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Included in this plan:</p>
          <ul className="flex list-disc flex-col gap-2 px-4 pt-2">
            <li>100 Concurrent Connections</li>
            <li>1M Incoming Messages</li>
            <li>1M Outgoing Messages</li>
            <li>
              <b>Unlimited</b> Feeds
            </li>
            <li>No credit card required</li>
          </ul>

          <p className="pt-4 text-xl">
            <span className="text-2xl font-bold">$0</span>/month
          </p>
        </CardContent>
        <CardFooter>{FreePlanFooter}</CardFooter>
      </Card>
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Launch Plan</CardTitle>
          <CardDescription>
            You decide your limits, we scale for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Included in this plan:</p>
          <ul className="flex list-disc flex-col gap-2 px-4 pt-2">
            <li>10k Concurrent Connections</li>
            <li>10M Incoming Messages</li>
            <li>10M Outgoing Messages</li>
            <li>
              <b>Unlimited</b> Feeds
            </li>
            <li>Check logs</li>
          </ul>

          <p className="pt-4 text-xl">
            <span className="text-2xl font-bold">$20</span>/month
          </p>
        </CardContent>
        <CardFooter>{LaunchPlanFooter}</CardFooter>
      </Card>
      <Card className="border-primary-foreground bg-primary text-white">
        <CardHeader>
          <CardTitle>Enterprise</CardTitle>
          <CardDescription>
            Benefit your business from exclusive features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Included in this plan:</p>
          <ul className="flex list-disc flex-col gap-2 px-4 pt-2">
            <li>Usage based pricing</li>
            <li>Unlimited Concurrent Connections</li>
            <li>Unlimited Throughoutput</li>
            <li>CNAME, SSO, & more...</li>
            <li>24/7 Support</li>
          </ul>

          <p className="pt-4 text-2xl">Custom</p>
        </CardContent>
        <CardFooter className="mt-auto">{EnterprisePlanFooter}</CardFooter>
      </Card>
    </div>
  );
}
