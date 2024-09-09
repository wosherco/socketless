import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@socketless/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";
import { Skeleton } from "@socketless/ui/skeleton";

import { validateRequest } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Overview",
};

async function Usage({ projectId }: { projectId: number }) {
  const projectUsage = await api.project.stats({
    projectId,
  });

  if (!projectUsage) {
    return null;
  }

  return (
    <>
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Incoming Messages</CardTitle>
          <CardDescription>Messages that you've published</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{projectUsage.incomingMessages}</p>
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Outgoing Messages</CardTitle>
          <CardDescription>Messages that clients sent from websockets</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{projectUsage.outgoingMessages}</p>
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Concurrent Connections</CardTitle>
          <CardDescription>How many clients are connected right now</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{projectUsage.concurrentConnections}</p>
        </CardContent>
      </Card>

      {/* <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Current Connections</CardTitle>
          <CardDescription>
            Amount of clients currently connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{projectUsage.currentConnectionsTotal}</p>
        </CardContent>
      </Card>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Peak Connections</CardTitle>
          <CardDescription>Peak of clients connected</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{projectUsage.peakConnections}</p>
        </CardContent>
      </Card> */}
    </>
  );
}

function SkeletonUsageCard() {
  return (
    <Card className="flex-grow">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-[24px] w-[80px] rounded-xl" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-[24px] w-[70px] rounded-xl" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[24px] w-[40px] rounded-xl" />
      </CardContent>
    </Card>
  );
}

export default async function Page({
  params,
}: {
  params: { projectId: string };
}) {
  const { user } = await validateRequest();
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  const project = await api.project.getProject({
    projectId: parsedProjectId,
  });


  return (
    <>
      <h1 className="text-xl font-medium">👋 Welcome back, {user?.username}</h1>
      <h2 className="text-sm text-muted-foreground">
        You're seeing the project {project.name}
      </h2>

      <div className="flex flex-col gap-4 py-4 md:flex-row">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Check out the documentation to get started in minutes.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="https://docs.socketless.ws" target="_blank">
                Go to the documentation <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Test a websocket</CardTitle>
            <CardDescription>
              Want to test a websocket? Use the playground to test it out.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href={`/${parsedProjectId}/connect`}>
                Go to Connect <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="pt-8">
        <h3 className="text-xl font-medium">📊 Your usage this month</h3>
        <div className="flex flex-wrap justify-center gap-4 py-4">
          <Suspense
            fallback={
              <>
                <SkeletonUsageCard />
                <SkeletonUsageCard />
                <SkeletonUsageCard />
              </>
            }
          >
            <Usage projectId={parsedProjectId} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
