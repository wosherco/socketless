import * as React from "react";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";
import ProjectMenu from "./_components/ProjectMenu";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  return (
    <div className="flex min-w-0 grow flex-col sm:flex-row">
      <ProjectMenu projectId={parsedProjectId} />

      <div className="flex flex-grow flex-col overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
