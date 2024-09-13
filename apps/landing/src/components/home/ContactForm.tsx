"use client";

import { Button } from "@socketless/ui/button";
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
import { Textarea } from "@socketless/ui/textarea";
import { toast } from "@socketless/ui/toast";
import { HomeContactFormSchema } from "@socketless/validators/forms";

import { api } from "~/trpc/react";

export default function ContactForm() {
  const form = useForm({
    schema: HomeContactFormSchema,
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const createPost = api.home.contact.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Message sent successfully.");
      } else {
        toast.error("Failed to send message. Try again later.");
      }
    },
    onError: () => {
      toast.error("Failed to send message.");
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="youremail@example.com"
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-[100px] resize-none"
                  placeholder="Message..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={createPost.isPending} className="ml-auto w-fit">
          Send Message
        </Button>
      </form>
    </Form>
  );
}
