import { Suspense } from "react";
import Link from "next/link";
import { MoveRight } from "lucide-react";

import { Button } from "@socketless/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@socketless/ui/card";
import { Skeleton } from "@socketless/ui/skeleton";

import { CreateProjectDialog } from "~/components/forms/create-project-form";
import { api } from "~/trpc/server";

function Project({ project }: { project: { id: number; name: string } }) {
  return (
    <Link href={`/${project.id}`}>
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          {/* <CardDescription>Card Description</CardDescription> */}
        </CardHeader>
        <CardFooter>
          <Button className="w-full">
            Go to Project <MoveRight className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

function ProjectSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4 w-[100px]" />
        </CardTitle>
        {/* <CardDescription>Card Description</CardDescription> */}
      </CardHeader>
      <CardFooter>
        <Skeleton className="h-[24px] w-[150px] rounded-xl" />
      </CardFooter>
    </Card>
  );
}

async function Projects() {
  const projects = await api.project.getProjects();

  return projects.map((p) => <Project project={p} />);
}

export default function Page() {
  return (
    <>
      <div className="flex flex-row justify-between">
        <h1 className="text-3xl font-medium">Your projects</h1>
        <CreateProjectDialog>
          <Button>+ Create Project</Button>
        </CreateProjectDialog>
      </div>

      <div className="my-8 flex flex-wrap gap-8">
        <Suspense
          fallback={
            <>
              <ProjectSkeleton />
              <ProjectSkeleton />
              <ProjectSkeleton />
            </>
          }
        >
          <Projects />
        </Suspense>
      </div>
    </>
  );
}
