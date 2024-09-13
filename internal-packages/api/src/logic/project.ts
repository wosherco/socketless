import { nanoid } from "nanoid";

import type { DBType } from "@socketless/db/client";
import { and, count, eq, gte, not } from "@socketless/db";
import {
  connectedClientsTable,
  logsTable,
  projectTable,
  userTable,
} from "@socketless/db/schema";

import { createProjectToken } from "./projectToken";

export async function getProjects(db: DBType, userId: string) {
  return await db
    .select({ id: projectTable.id, name: projectTable.name })
    .from(projectTable)
    .where(and(eq(projectTable.ownerId, userId), not(projectTable.deleted)));
}

export async function getProject(db: DBType, projectId: number) {
  return await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.id, projectId))
    .then((res) => res[0]);
}

export async function getProjectWithOwner(db: DBType, projectId: number) {
  return await db
    .select()
    .from(projectTable)
    .innerJoin(userTable, eq(projectTable.ownerId, userTable.id))
    .where(eq(projectTable.id, projectId))
    .then((res) => res[0]);
}

/**
 * Get projects from a user perspective. If the user doesn't belong to the project, it will return undefined.
 *
 * @returns undefined if the user doesn't belong to the project, or if the project doesn't exist.
 */
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

export async function getProjectLimits(db: DBType, projectId: number) {
  return db
    .select({
      concurrentConnectionsLimit: projectTable.concurrentConnectionsLimit,
      incomingMessagesLimit: projectTable.incomingMessagesLimit,
      outgoingMessagesLimit: projectTable.outgoingMessagesLimit,
    })
    .from(projectTable)
    .where(eq(projectTable.id, projectId))
    .then((res) => res[0]);
}

export async function createProject(
  db: DBType,
  projectName: string,
  creatorId: string,
) {
  const clientId = `wskl_live_${nanoid(21)}`;

  const [project] = await db
    .insert(projectTable)
    .values({
      name: projectName,
      clientId: clientId,
      ownerId: creatorId,
    })
    .returning();

  if (!project) {
    throw new Error("Failed to create project");
  }

  await createProjectToken(db, project.id, "Secret Token");

  return project;
}

export async function getConcurrentConnections(db: DBType, projectId: number) {
  return db
    .select({
      count: count(),
    })
    .from(connectedClientsTable)
    .where(eq(connectedClientsTable.projectId, projectId))
    .then((res) => res[0]);
}

export async function getProjectIncomingMessages(
  db: DBType,
  projectId: number,
) {
  return db
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
    .then((res) => res[0]);
}

export async function getProjectOutgoingMessages(
  db: DBType,
  projectId: number,
) {
  return db
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
    .then((res) => res[0]);
}

export async function getProjectStats(db: DBType, projectId: number) {
  const [fetchedProject, incoming, outgoing] = await Promise.all([
    // Getting concurrent connections
    getConcurrentConnections(db, projectId),
    // Getting Incoming messages
    getProjectIncomingMessages(db, projectId),
    // Getting Outgoing messages
    getProjectOutgoingMessages(db, projectId),
  ]);

  if (!fetchedProject || !incoming || !outgoing) {
    return null;
  }

  return {
    concurrentConnections: fetchedProject.count,
    incomingMessages: incoming.count,
    outgoingMessages: outgoing.count,
  };
}
