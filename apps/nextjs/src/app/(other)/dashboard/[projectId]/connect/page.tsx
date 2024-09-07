import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConnectDashboard from "~/components/dashboard/ConnectDashboard";
import { api } from "~/trpc/server";


export const metadata: Metadata = {
  title: "Connect",
};

export default async function Page({ params }: {
  params: { projectId: string };
}) {
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  const projectTokens = await api.projectToken.getTokens({
    projectId: parsedProjectId,
  })

  // const project = await api.project.getProject({
  //   projectId: parsedProjectId,
  // });

  // if (!project) {
  //   notFound();
  // }

  return (
    <>
      <h1 className="text-xl font-medium">Connect</h1>
      <h2 className="text-sm text-muted-foreground">
        Test your websockets right here.
      </h2>
      <ConnectDashboard projectId={parsedProjectId} tokens={projectTokens} />
    </>
  );
}
