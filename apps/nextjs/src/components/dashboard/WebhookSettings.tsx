"use client";

import type { z } from "zod";
import { useEffect, useState } from "react";

import type { ProjectConfigSchema } from "@socketless/validators";
import { Button } from "@socketless/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";
import { Checkbox } from "@socketless/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@socketless/ui/form";
import { Input } from "@socketless/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@socketless/ui/select";
import { toast } from "@socketless/ui/toast";
import {
  EWebhookActions,
  ProjectConfigPrivacyFormSchema,
  ProjectConfigWebhookFormSchema,
} from "@socketless/validators";

import { api } from "~/trpc/react";

export default function WebhookSettings({
  projectId,
  config,
}: {
  projectId: number;
  config: z.infer<typeof ProjectConfigSchema>;
}) {
  const webhookForm = useForm({
    schema: ProjectConfigWebhookFormSchema,
    defaultValues: {
      projectId,
      webhookUrl: config.webhookUrl,
      events: config.webhookEvents,
    },
  });
  const rotateWebhookKey = api.projectSettings.rotateWebhookSecret.useMutation({
    onSuccess(data) {
      setWebhookSecret(data.secret);
      toast.success("Secret rotated");
    },
    onError() {
      toast.error("Failed to rotate secret");
    },
  });
  const updateWebhookUrl = api.projectSettings.setWebhookUrl.useMutation({
    onSuccess() {
      toast.success("Webhook updated");
    },
    onError() {
      toast.error("Failed to update webhook");
    },
  });

  const messagePrivacyForm = useForm({
    schema: ProjectConfigPrivacyFormSchema,
    defaultValues: {
      projectId,
      level: config.messagePrivacyLevel,
    },
  });
  const updateMessagePrivacy =
    api.projectSettings.setMessagePrivacyLevel.useMutation({
      onSuccess() {
        toast.success("Message privacy updated");
      },
      onError() {
        toast.error("Failed to update privacy");
      },
    });

  const [revealed, setRevealed] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState(config.webhookSecret);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      updateWebhookUrl.isPending ||
      rotateWebhookKey.isPending ||
      updateMessagePrivacy.isPending
    ) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [
    updateWebhookUrl.isPending,
    rotateWebhookKey.isPending,
    updateMessagePrivacy.isPending,
  ]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Webhook</CardTitle>
          <CardDescription>
            Configure a Webhook to receive when a client connects, sends a
            message, and disconnects.{" "}
            <a
              href="https://docs.socketless.ws"
              target="_blank"
              className="underline"
            >
              More info on our docs
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...webhookForm}>
            <form
              className="flex w-full max-w-2xl flex-col gap-4"
              onSubmit={webhookForm.handleSubmit((data) => {
                updateWebhookUrl.mutate(data);
              })}
            >
              <FormField
                control={webhookForm.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Url</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? undefined}
                        placeholder="https://example.com/webhook"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={webhookForm.control}
                name="events"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Webhook Events
                      </FormLabel>
                      <FormDescription>
                        Select the events you want to receive through the
                        webhook.
                      </FormDescription>
                    </div>
                    {Object.values(EWebhookActions).map((item) => (
                      <FormField
                        key={item}
                        control={webhookForm.control}
                        name="events"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item])
                                      : field.onChange(
                                          field.value.filter(
                                            (value) => value !== item,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-x-2">
                <Button disabled={loading}>Update Webhook</Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    updateWebhookUrl.mutate({
                      projectId: projectId,
                      webhookUrl: null,
                      events: [],
                    });
                    webhookForm.setValue("webhookUrl", "");
                  }}
                >
                  Disable Webhook
                </Button>
              </div>
            </form>
          </Form>

          <p className="pt-4 text-sm font-medium">Webhook Secret</p>

          <WebhookSecretSecured reveal={revealed} secret={webhookSecret} />

          <div className="space-x-2">
            <Button onClick={() => setRevealed(!revealed)}>
              {revealed ? "Hide Webhook Secret" : "Show Webhook Secret"}
            </Button>
            <Button
              disabled={loading}
              onClick={() => rotateWebhookKey.mutate({ projectId: projectId })}
            >
              Rotate Secret
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Change the project privacy settings.
          </CardDescription>
        </CardHeader>
        <Form {...messagePrivacyForm}>
          <form
            className="flex w-full max-w-2xl flex-col gap-4"
            onSubmit={messagePrivacyForm.handleSubmit((data) => {
              updateMessagePrivacy.mutate(data);
            })}
          >
            <CardContent>
              <FormField
                control={messagePrivacyForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Logging Strategy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a privacy level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALWAYS">Always</SelectItem>
                        <SelectItem value="ONLY-ERRORS">
                          Only on errors
                        </SelectItem>
                        <SelectItem value="NONE">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col items-start justify-start gap-2">
              <Button disabled={loading} type="submit">
                Update
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}

function WebhookSecretSecured({
  reveal,
  secret,
}: {
  reveal: boolean;
  secret: string;
}) {
  return (
    <Input
      value={reveal ? secret : "******************"}
      readOnly={true}
      className="my-4"
    />
  );
}
