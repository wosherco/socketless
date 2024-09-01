"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@socketless/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { DeleteWebhookDialog } from "../forms/delete-webhook-form";

export default function WebhookMoreOptionsMenu({ projectId, webhookId }: { projectId: number; webhookId: number; }) {
  const [deleteDialog, setDeleteDialog] = useState(false);

  return <>
    <DeleteWebhookDialog projectId={projectId} webhookId={webhookId} open={deleteDialog} setOpen={setDeleteDialog} />
    <DropdownMenu>
      <DropdownMenuTrigger><MoreHorizontal /></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem disabled>Roll Secret</DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialog(true)}>Delete Webhook</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
}