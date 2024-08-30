import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Input } from "@socketless/ui/input";

import ClientSecret from "~/components/dashboard/ClientSecret";
import CopyButton from "~/components/utility/CopyButton";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "API Keys",
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

  const project = await api.projects.getProject.query({
    projectId: parsedProjectId,
    includeSecret: true,
  });

  if (!project) {
    return notFound();
  }

  return (
    <>
      <h1 className="text-xl font-medium">API Keys</h1>
      <h2 className="text-sm text-muted-foreground">
        Manage your Socketless API Keys for this project.
      </h2>

      <div className="mt-4">
        <p className="my-2">Client Id</p>
        <div className="flex flex-row space-x-2">
          <Input value={project.clientId} readOnly={true} />
          <CopyButton value={project.clientId} />
        </div>
      </div>
      <div>
        <ClientSecret project={project} />
      </div>
    </>
  );
}
