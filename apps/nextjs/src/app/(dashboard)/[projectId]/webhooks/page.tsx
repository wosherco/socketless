import type { Metadata } from "next";
import { notFound } from "next/navigation";

// import ClientSecret from "~/components/dashboard/ClientSecret";
import { Skeleton } from "@socketless/ui/skeleton";
import { Suspense } from "react";
import CopyButton from "~/components/utility/CopyButton";
import { api } from "~/trpc/server";

import { Button } from "@socketless/ui/button";
import HidableInput from "~/components/dashboard/HidableInput";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@socketless/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CreateWebhookDialog from "~/components/forms/create-webhook-form";
import WebhookMoreOptionsMenu from "~/components/dashboard/WebhookMoreOptionsMenu";

export const metadata: Metadata = {
  title: "Webhooks",
};

async function ProjectWebhooks({ projectId }: { projectId: number }) {
  const tokens = await api.projectWebhook.getWebhooks({ projectId });

  return <div className="flex flex-col gap-4">
    <CreateWebhookDialog projectId={projectId}>
      <Button className="w-fit">
        + Create Webhook
      </Button>
    </CreateWebhookDialog>

    {tokens.map((webhook) => (
      <div className="p-2 rounded-lg border-[1px] flex flex-row items-center" key={webhook.id}>
        <p>{webhook.name}</p>
        <div className="flex flex-row flex-grow px-4 gap-4">
          <HidableInput value={webhook.secret} />
          {/* <Input value={token.token} readOnly={true} /> */}
          <CopyButton value={webhook.secret} />
        </div>

        <WebhookMoreOptionsMenu projectId={projectId} webhookId={webhook.id} />
      </div>
    ))}
  </div>
}

export default function Page({
  params,
}: {
  params: { projectId: string };
}) {
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  return (
    <>
      <h1 className="text-xl font-medium">Webhooks</h1>
      <h2 className="text-sm text-muted-foreground">
        Manage your Webhooks here.
      </h2>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle><span className="mr-2">⚠️</span> A webhook is not mandatory</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            When using socketless with an official client, you don't need a webhook. If you want a custom service to listen to message and connections, you can add up to 4 webhooks.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="https://docs.socketless.ws" target="_blank">
            <Button className="w-full">Check the docs <ArrowRight /></Button>
          </Link>
        </CardFooter>
      </Card>

      <div className="mt-4">
        <Suspense fallback={
          <Skeleton className="w-full" />
        }>
          <ProjectWebhooks projectId={parsedProjectId} />
        </Suspense>
      </div>
    </>
  );
}
