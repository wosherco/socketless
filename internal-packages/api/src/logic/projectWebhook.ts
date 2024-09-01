import type { DBType } from "@socketless/db/client";
import { eq } from "@socketless/db";
import { projectWebhookTable } from "@socketless/db/schema";

import { generateWebhookSecret } from "../utils";

export async function createProjectWebhook(
  db: DBType,
  projectId: number,
  name: string,
  url: string,
  sendOnConnect?: boolean,
  sendOnMessage?: boolean,
  sendOnDisconnect?: boolean,
) {
  const secret = generateWebhookSecret();

  const [webhook] = await db
    .insert(projectWebhookTable)
    .values({
      projectId,
      name,
      url,
      secret,
      sendOnConnect,
      sendOnMessage,
      sendOnDisconnect,
    })
    .returning({
      url: projectWebhookTable.url,
      name: projectWebhookTable.name,
      secret: projectWebhookTable.secret,
      sendOnConnect: projectWebhookTable.sendOnConnect,
      sendOnMessage: projectWebhookTable.sendOnMessage,
      sendOnDisconnect: projectWebhookTable.sendOnDisconnect,
    });

  return webhook;
}

export async function getProjectWebhooks(db: DBType, projectId: number) {
  const webhooks = await db
    .select()
    .from(projectWebhookTable)
    .where(eq(projectWebhookTable.projectId, projectId));

  return webhooks;
}

export async function getProjectWebhook(db: DBType, webhookId: number) {
  const [webhook] = await db
    .select()
    .from(projectWebhookTable)
    .where(eq(projectWebhookTable.id, webhookId));

  return webhook;
}

export async function updateProjectWebhookUrl(
  db: DBType,
  webhookId: number,
  url: string,
) {
  await db
    .update(projectWebhookTable)
    .set({ url })
    .where(eq(projectWebhookTable.id, webhookId));
}

export async function rotateProjectWebhookSecret(
  db: DBType,
  webhookId: number,
) {
  const newSecret = generateWebhookSecret();

  await db
    .update(projectWebhookTable)
    .set({ secret: newSecret })
    .where(eq(projectWebhookTable.id, webhookId));

  return newSecret;
}

export async function deleteProjectWebhook(db: DBType, webhookId: number) {
  await db
    .delete(projectWebhookTable)
    .where(eq(projectWebhookTable.id, webhookId));
}
