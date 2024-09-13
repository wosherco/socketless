import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@socketless/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";

export const metadata: Metadata = {
  title: "Settings",
};

export default function Page({ params }: { params: { projectId: string } }) {
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  // const project = await api.project.getProject({
  //   projectId: parsedProjectId,
  // });

  // const edgeLimits = await api.projectLimits.getEdgeLimits.query({
  //   projectId: parsedProjectId,
  // });

  // const isFree = project?.plan === "FREE";

  return (
    <>
      <h1 className="text-xl font-medium">Settings</h1>
      <h2 className="text-sm text-muted-foreground">
        Manage your project settings from here.
      </h2>
      <div className="flex flex-col gap-4 py-4">
        {/* <LimitsSettings
          limits={edgeLimits}
          projectId={parsedProjectId}
          free={isFree}
        /> */}

        <Card>
          <CardHeader>
            <CardTitle>Delete Project</CardTitle>
            <CardDescription>
              Deleting your project means that channels and connections will
              dissapear, and currently connected clients will get disconnected.
              If you really want to delete this project, continue below.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col items-start justify-start gap-2">
            <Button variant={"destructive"} disabled>
              Delete Project
            </Button>
            <p className="text-xs text-muted-foreground">
              Deleting project is currently a manual action. Please, contact us
              at{" "}
              <a
                className="text-primary underline"
                href="mailto:contact@socketless.ws"
              >
                contact@socketless.ws
              </a>{" "}
              to proceed with the deletion.
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
