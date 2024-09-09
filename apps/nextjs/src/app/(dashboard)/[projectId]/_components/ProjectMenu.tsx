"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Book,
  CircleDollarSign,
  GalleryVerticalEnd,
  Home,
  Info,
  KeyRound,
  List,
  Rss,
  Settings,
  Webhook,
} from "lucide-react";

import { cn } from "@socketless/ui";

function ProjectMenuButton({
  children,
  icon,
  href,
  newtab
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  href: string;
  newtab?: boolean;
}) {
  const currentPathname = usePathname();
  const [marked, setMarked] = React.useState(false);

  React.useEffect(() => {
    if (href === currentPathname) {
      setMarked(true);
    } else {
      setMarked(false);
    }
  }, [currentPathname, href, setMarked]);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-row items-center rounded-lg px-4 py-2 transition-colors hover:bg-accent disabled:opacity-50",
        marked && "bg-accent",
      )}
      target={newtab ? "_blank" : undefined}
    >
      <span className="md:mr-2">{icon}</span>{" "}
      <span className="hidden text-sm font-medium md:block">{children}</span>
    </Link>
  );
}

export default function ProjectMenu({ projectId }: { projectId: number }) {
  return (
    <div className="sticky flex w-screen shrink-0 flex-row items-start justify-around gap-2 p-4 md:w-[215px] md:flex-col md:justify-start">
      <ProjectMenuButton
        icon={<Home width={20} />}
        href={`/${projectId}`}
      >
        Overview
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<GalleryVerticalEnd width={20} />}
        href={`/${projectId}/logs`}
      >
        Logs
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<List width={20} />}
        href={`/${projectId}/feeds`}
      >
        Feeds
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<Rss width={20} />}
        href={`/${projectId}/connect`}
      >
        Connect
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<KeyRound width={20} />}
        href={`/${projectId}/tokens`}
      >
        Tokens
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<Webhook width={20} />}
        href={`/${projectId}/webhooks`}
      >
        Webhooks
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<CircleDollarSign width={20} />}
        href={`/${projectId}/billing`}
      >
        Billing
      </ProjectMenuButton>

      <ProjectMenuButton
        icon={<Settings width={20} />}
        href={`/${projectId}/settings`}
      >
        Settings
      </ProjectMenuButton>

      <hr className="mx-2 w-full rounded-full border-primary/20" />

      <ProjectMenuButton
        icon={<Book width={20} />}
        href="https://docs.socketless.ws"
        newtab
      >
        Docs
      </ProjectMenuButton>

      <ProjectMenuButton icon={<Info width={20} />} href="mailto:support@socketless.ws" newtab>
        Support
      </ProjectMenuButton>
    </div>
  );
}
