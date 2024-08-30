import { nanoid } from "nanoid";
import Stripe from "stripe";

import type { DBType } from "@socketless/db/client";
import { and, eq, not } from "@socketless/db";
import { projectTable } from "@socketless/db/schema";

import { env } from "../../env";
import { generateClientSecret } from "../utils";

export async function getProjects(db: DBType, userId: string) {
  return await db
    .select({ id: projectTable.id, name: projectTable.name })
    .from(projectTable)
    .where(and(eq(projectTable.ownerId, userId), not(projectTable.deleted)));
}

export async function getProjectFromUser(
  db: DBType,
  userId: string,
  projectId: number,
) {
  const [project] = await db
    .select()
    .from(projectTable)
    .where(
      and(
        eq(projectTable.ownerId, userId),
        eq(projectTable.id, projectId),
        not(projectTable.deleted),
      ),
    );

  return project;
}

export async function createProject(
  db: DBType,
  projectName: string,
  creatorId: string,
  creatorEmail: string,
) {
  const clientId = `wskl_live_${nanoid(21)}`;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const stripeCustomer = await stripe.customers.create({
    metadata: {
      clientId,
    },
    email: creatorEmail,
  });

  try {
    const [project] = await db
      .insert(projectTable)
      .values({
        name: projectName,
        clientId: clientId,
        clientSecret: generateClientSecret(),
        stripeCustomerId: stripeCustomer.id,
        ownerId: creatorId,
      })
      .returning();

    if (!project) {
      throw new Error("Failed to create project");
    }

    return project;
  } catch (e) {
    await stripe.customers.del(stripeCustomer.id);

    throw e;
  }
}

export async function resetClientSecret(db: DBType, projectId: number) {
  const newSecret = generateClientSecret();

  await db
    .update(projectTable)
    .set({
      clientSecret: newSecret,
    })
    .where(and(eq(projectTable.id, projectId), not(projectTable.deleted)));

  return newSecret;
}
