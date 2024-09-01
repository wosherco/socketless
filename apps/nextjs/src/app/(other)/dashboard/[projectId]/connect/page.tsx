import type { Metadata } from "next";


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
      <em>Coming soon...</em>

      <p>Test your websocket right here.</p>
      {/* <ConnectTesting project={project} /> */}
    </>
  );
}
