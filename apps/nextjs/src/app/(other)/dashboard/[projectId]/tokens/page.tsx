import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Input } from "@socketless/ui/input";

// import ClientSecret from "~/components/dashboard/ClientSecret";
import { Skeleton } from "@socketless/ui/skeleton";
import { Suspense } from "react";
import CopyButton from "~/components/utility/CopyButton";
import { api } from "~/trpc/server";

import { Button } from "@socketless/ui/button";
import HidableInput from "~/components/dashboard/HidableInput";
import TokenMoreOptionsMenu from "~/components/dashboard/TokenMoreOptionsMenu";
import { CreateTokenDialog } from "~/components/forms/create-token-form";

export const metadata: Metadata = {
  title: "API Keys",
};

async function ClientIdSection({ projectId }: { projectId: number }) {
  const project = await api.project.getProject({ projectId });

  return <div className="flex flex-row space-x-2">
    <Input value={project.clientId} readOnly={true} />
    <CopyButton value={project.clientId} />
  </div>
}


async function ProjectTokens({ projectId }: { projectId: number }) {
  const tokens = await api.projectToken.getTokens({ projectId });

  return <div className="flex flex-col gap-4">
    <CreateTokenDialog projectId={projectId}>
      <Button className="w-fit">
        + Create Token
      </Button>
    </CreateTokenDialog>
    {tokens.map((token) => (<div className="p-2 rounded-lg border-[1px] flex flex-row items-center" key={token.id}>
      <p>{token.name}</p>
      <div className="flex flex-row flex-grow px-4 gap-4">
        <HidableInput value={token.token} />
        {/* <Input value={token.token} readOnly={true} /> */}
        <CopyButton value={token.token} />
      </div>

      <TokenMoreOptionsMenu projectId={projectId} tokenId={token.id} />
    </div>))}
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
      <h1 className="text-xl font-medium">API Keys</h1>
      <h2 className="text-sm text-muted-foreground">
        Manage your Socketless API Keys for this project.
      </h2>

      <div className="mt-4">
        <p className="my-2">Client Id</p>

        <Suspense fallback={
          <Skeleton className="w-full" />
        }>
          <ClientIdSection projectId={parsedProjectId} />
        </Suspense>
      </div>
      <div className="mt-4">
        <p className="my-2">Tokens</p>

        <Suspense fallback={
          <Skeleton className="w-full" />
        }>
          <ProjectTokens projectId={parsedProjectId} />
        </Suspense>
      </div>
    </>
  );
}
