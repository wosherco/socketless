"use client";

import { useState } from "react";
import type { ReactNode } from "react";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useForm } from "@socketless/ui/form";
import { CreateProjectSchema } from "@socketless/validators";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "@socketless/ui/toast";
import { Input } from "@socketless/ui/input";
import { Button } from "@socketless/ui/button";


export function CreateProjectDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Project</DialogTitle>
          <DialogDescription>
            Create a new project to start using Socketless. Note that billing is
            attached to projects, not to your account.
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm close={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default function CreateProjectForm({ close }: { close?: () => void }) {
  const form = useForm({
    schema: CreateProjectSchema,
    defaultValues: {
      name: "",
    },
  });
  const router = useRouter();

  const utils = api.useUtils();
  const createPost = api.project.createProject.useMutation({
    onSuccess: async (data) => {
      if (close) {
        close()
      }
      await utils.project.getProjects.invalidate();
      router.push(`/dashboard/${data.id}`);
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
          createPost.mutate(data);
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={createPost.isPending} className="ml-auto w-fit">
          Create Project
        </Button>
      </form>
    </Form>
  );
}
