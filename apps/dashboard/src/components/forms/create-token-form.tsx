"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@socketless/ui/button";
// import { useRouter } from "next/navigation";

// import { Button } from "@socketless/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@socketless/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@socketless/ui/form";
import { Input } from "@socketless/ui/input";
import { toast } from "@socketless/ui/toast";
import { ProjectTokenCreateFormSchema } from "@socketless/validators/forms";

import { api } from "~/trpc/react";

export function CreateTokenDialog({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-left">{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Token</DialogTitle>
          <DialogDescription>
            Create a new token to your for your Socketless Project.
          </DialogDescription>
        </DialogHeader>
        <CreateTokenForm close={() => setOpen(false)} projectId={projectId} />
      </DialogContent>
    </Dialog>
  );
}

export default function CreateTokenForm({
  close,
  projectId,
}: {
  close?: () => void;
  projectId: number;
}) {
  const router = useRouter();
  const form = useForm({
    schema: ProjectTokenCreateFormSchema,
    defaultValues: {
      name: "",
    },
  });

  const createToken = api.projectToken.createToken.useMutation({
    onSuccess: () => {
      if (close) {
        close();
      }
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to create project.");
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-2xl flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          createToken.mutate({ ...data, projectId });
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={createToken.isPending} className="ml-auto w-fit">
          Create Token
        </Button>
      </form>
    </Form>
  );
}
