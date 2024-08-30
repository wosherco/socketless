"use client";

import { useState } from "react";

import { Button } from "@socketless/ui/button";
import { Input } from "@socketless/ui/input";
import { toast } from "@socketless/ui/toast";

import type { api as apiserver } from "~/trpc/server";
import { api } from "~/trpc/react";
import CopyButton from "../utility/CopyButton";

function SecretField({
  secret,
  reveal,
}: {
  secret: string | null;
  reveal: boolean;
}) {
  return (
    <div className="flex flex-row space-x-2">
      <Input
        value={
          (reveal ? secret : "*******************************") ?? "Loading..."
        }
        disabled={!secret || !reveal}
        readOnly={true}
      />
      <CopyButton value={secret ?? undefined} />
    </div>
  );
}

export default function ClientSecret({
  project,
}: {
  project: Exclude<
    Awaited<ReturnType<typeof apiserver.projects.getProject.query>>,
    undefined
  >;
}) {
  const [secretKey, setSecretKey] = useState<string>(
    project.clientSecret ?? "undefined",
  );
  const [revealed, setRevealed] = useState(false);

  const rotateSecret = api.projects.resetClientSecret.useMutation({
    onSuccess: (data) => {
      setSecretKey(data.clientSecret);
      toast.success("Secret rotated");
    },
  });

  return (
    <div className="py-4">
      <p className="py-2">Client Secret</p>
      <SecretField reveal={revealed} secret={secretKey} />
      <div className="flex flex-row gap-2 py-4">
        <Button onClick={() => setRevealed(!revealed)}>Reveal</Button>
        <Button
          onClick={() => rotateSecret.mutate({ projectId: project.id })}
          disabled={rotateSecret.isPending}
        >
          Rotate
        </Button>
      </div>
    </div>
  );
}
