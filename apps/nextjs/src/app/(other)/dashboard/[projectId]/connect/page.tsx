import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ConnectTesting from "~/components/dashboard/ConnectTesting";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Connect",
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
    notFound();
  }

  return (
    <>
      <em>Coming soon...</em>

      <p>Test your websocket right here.</p>
      <ConnectTesting project={project} />
    </>
  );
}
