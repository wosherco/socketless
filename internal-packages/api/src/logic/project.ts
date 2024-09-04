import { nanoid } from "nanoid";
import Stripe from "stripe";

import type { DBType } from "@socketless/db/client";
import { and, count, eq, gte, not } from "@socketless/db";
import { logsTable, projectTable } from "@socketless/db/schema";

import { env } from "../../env";
import { generateClientSecret } from "../utils";
import { createProjectToken } from "./projectToken";

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
        stripeCustomerId: stripeCustomer.id,
        ownerId: creatorId,
      })
      .returning();

    if (!project) {
      throw new Error("Failed to create project");
    }

    await createProjectToken(db, project.id, "Secret Token");

    return project;
  } catch (e) {
    await stripe.customers.del(stripeCustomer.id);

    throw e;
  }
}

export async function getProjectStats(db: DBType, projectId: number) {
  const [fetchedProject, incoming, outgoing] = await Promise.all([
    // Getting concurrent connections
    db
      .select({
        concurrentConnections: projectTable.concurrentConnections,
      })
      .from(projectTable)
      .where(eq(projectTable.id, projectId))
      .then((res) => res[0]),
    // Getting Incoming messages
    db
      .select({ count: count() })
      .from(logsTable)
      .where(
        and(
          eq(logsTable.projectId, projectId),
          eq(logsTable.action, "INCOMING"),
          // Getting messages from the last 30 days
          gte(
            logsTable.timestamp,
            new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          ),
        ),
      )
      .then((res) => res[0]),
    // Getting Outgoing messages
    db
      .select({ count: count() })
      .from(logsTable)
      .where(
        and(
          eq(logsTable.projectId, projectId),
          eq(logsTable.action, "OUTGOING"),
          // Getting messages from the last 30 days
          gte(
            logsTable.timestamp,
            new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          ),
        ),
      )
      .then((res) => res[0]),
  ]);

  if (!fetchedProject || !incoming || !outgoing) {
    return null;
  }

  return {
    concurrentConnections: fetchedProject.concurrentConnections,
    incomingMessages: incoming.count,
    outgoingMessages: outgoing.count,
  };
}
