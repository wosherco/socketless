import { verifySignature, WebhookPayloadSchema } from "@socketless/shared";

export async function constructWebhookPayload(req: Request, secret: string) {
  const body = await req.text();
  const signature = req.headers.get("x-socketless-signature");

  // TODO: Better error handling
  try {
    const res = await verifySignature(body, signature, secret);

    if (!res) {
      throw new Error("Invalid signature");
    }
  } catch (e) {
    console.error(e);
    throw new Error("Invalid signature");
  }

  const payload = await WebhookPayloadSchema.safeParseAsync(JSON.parse(body));

  if (!payload.success) {
    throw new Error("Invalid payload");
  }

  return payload.data;
}
