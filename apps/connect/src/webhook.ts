import {
  SimpleWebhook,
  WebhookPayloadType,
  WebhookResponseSchema,
} from "@socketless/validators/types";

export async function sendWebhook(
  webhook: SimpleWebhook,
  secret: string,
  payload: WebhookPayloadType,
) {
  const req = await fetch(webhook.url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!req.ok) {
    throw new Error("Failed to send webhook");
  }

  const res = await req.json();

  const responseActions = WebhookResponseSchema.safeParse(res);

  if (!responseActions.success) {
    throw new Error("Invalid webhook response");
  }

  return responseActions.data;
}
