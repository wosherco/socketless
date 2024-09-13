import type { SimpleWebhook, WebhookPayloadType } from "@socketless/shared";
import { signPayload, WebhookResponseSchema } from "@socketless/shared";

export async function sendWebhook(
  webhook: SimpleWebhook,
  payload: WebhookPayloadType,
) {
  const stringifiedPayload = JSON.stringify(payload);

  // Signing webhook payload
  const signedPayload = await signPayload(stringifiedPayload, webhook.secret);

  const req = await fetch(webhook.url, {
    method: "POST",
    body: stringifiedPayload,
    headers: {
      "Content-Type": "application/json",
      "x-socketless-signature": signedPayload,
    },
  });

  if (!req.ok) {
    throw new Error(
      `Failed to send webhook ${JSON.stringify(webhook)} ${req.status}`,
    );
  }

  const resAuthorization = req.headers.get("Authorization");

  if (resAuthorization == null) {
    throw new Error("Missing authorization header");
  }

  if (resAuthorization !== `Bearer ${webhook.secret}`) {
    throw new Error("Invalid authorization header");
  }

  const res = await req.json();

  const responseActions = WebhookResponseSchema.safeParse(res);

  if (!responseActions.success) {
    throw new Error("Invalid webhook response");
  }

  return responseActions.data;
}
