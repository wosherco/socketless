"use client";

import type { ReactNode } from "react";
import { useState } from "react";

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


export function DeleteTokenDialog({ children, projectId, tokenId, open, setOpen }: { children?: ReactNode; projectId: number; tokenId: number; open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter();

  const deleteToken = api.projectToken.deleteToken.useMutation({
    onSuccess: () => {
      toast.success("Token deleted.");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to delete token.");
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
          <AlertDialogCancel disabled={deleteToken.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleteToken.isPending} onClick={() => deleteToken.mutate({
            projectId,
            tokenId
          })}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
