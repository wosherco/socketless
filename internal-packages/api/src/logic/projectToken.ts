import type { DBType } from "@socketless/db/client";
import { eq } from "@socketless/db";
import { projectTokenTable } from "@socketless/db/schema";

import { generateClientSecret } from "../utils";

export async function createProjectToken(
  db: DBType,
  projectId: number,
  name: string,
) {
  const token = generateClientSecret();

  await db.insert(projectTokenTable).values({
    projectId,
    name,
    token,
  });

  return token;
}

export async function getProjectTokens(db: DBType, projectId: number) {
  const tokens = await db
    .select()
    .from(projectTokenTable)
    .where(eq(projectTokenTable.projectId, projectId));

  return tokens;
}

export async function getProjectToken(db: DBType, tokenId: number) {
  const [dbToken] = await db
    .select()
    .from(projectTokenTable)
    .where(eq(projectTokenTable.id, tokenId));

  return dbToken;
}

export async function rotateProjectToken(db: DBType, tokenId: number) {
  const newToken = generateClientSecret();

  await db
    .update(projectTokenTable)
    .set({ token: newToken })
    .where(eq(projectTokenTable.id, tokenId));

  return newToken;
}

export async function deleteProjectToken(db: DBType, tokenId: number) {
  await db.delete(projectTokenTable).where(eq(projectTokenTable.id, tokenId));
}
