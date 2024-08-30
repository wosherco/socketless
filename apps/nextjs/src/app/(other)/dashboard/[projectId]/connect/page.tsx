import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Connect",
};

export default async function Page({
  params,
}: {
  params: { projectId: string };
}) {
  // const parsedProjectId = parseInt(params.projectId);
  // if (isNaN(parsedProjectId)) {
  //   notFound();
  // }

  // const project = await api.project.getProject({
  //   projectId: parsedProjectId,
  // });

  // if (!project) {
  //   notFound();
  // }

  return (
    <>
      <em>Coming soon...</em>

      <p>Test your websocket right here.</p>
      {/* <ConnectTesting project={project} /> */}
    </>
  );
}
