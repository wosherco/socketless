"use client";

import type { ReactNode } from "react";

// import { useRouter } from "next/navigation";

// import { Button } from "@socketless/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@socketless/ui/alert-dialog";
import { toast } from "@socketless/ui/toast";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";


export function DeleteWebhookDialog({ children, projectId, webhookId, open, setOpen }: { children?: ReactNode; projectId: number; webhookId: number; open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter();

  const deleteWebhook = api.projectWebhook.deleteWebhook.useMutation({
    onSuccess: () => {
      toast.success("Webhook deleted.");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to delete webhook.");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="text-left">{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteWebhook.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleteWebhook.isPending} onClick={() => deleteWebhook.mutate({
            projectId,
            webhookId
          })}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
