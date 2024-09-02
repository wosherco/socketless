import type { Metadata } from "next";
import ConnectDashboard from "~/components/dashboard/ConnectDashboard";


export const metadata: Metadata = {
  title: "Connect",
};

export default function Page(_: {
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
      <p>Test your websocket right here.</p>
      <ConnectDashboard />
      {/* <ConnectTesting project={project} /> */}
    </>
  );
}
