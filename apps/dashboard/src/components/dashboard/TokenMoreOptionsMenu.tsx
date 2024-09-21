"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@socketless/ui/dropdown-menu";

import { DeleteTokenDialog } from "../forms/delete-token-form";

export default function TokenMoreOptionsMenu({
  projectId,
  tokenId,
}: {
  projectId: number;
  tokenId: number;
}) {
  const [deleteDialog, setDeleteDialog] = useState(false);

  return (
    <>
      <DeleteTokenDialog
        projectId={projectId}
        tokenId={tokenId}
        open={deleteDialog}
        setOpen={setDeleteDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Roll Token</DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDeleteDialog(true)}
          >
            Delete Token
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
