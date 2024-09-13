"use client";

import { Copy } from "lucide-react";

import { Button } from "@socketless/ui/button";
import { toast } from "@socketless/ui/toast";

export default function CopyButton({ value }: { value: string | undefined }) {
  return (
    <Button
      disabled={value == null}
      onClick={async () => {
        if (value == null) return;
        await navigator.clipboard.writeText(value);
        toast.info("Copied to clipboard!");
      }}
    >
      <Copy />
    </Button>
  );
}
