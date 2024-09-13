import * as React from "react";
import { notFound } from "next/navigation";

import { env } from "~/env";
import ProjectMenu from "./_components/ProjectMenu";

export default function Layout({
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
      <ProjectMenu
        projectId={parsedProjectId}
        enableBilling={env.STRIPE_SECRET_KEY !== undefined}
      />

      <div className="flex flex-grow flex-col overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
