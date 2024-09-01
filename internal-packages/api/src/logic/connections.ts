import type { DBType } from "@socketless/db/client";
import { createToken, verifyToken } from "@socketless/connection-tokens";

export async function createConnection(
  db: DBType,
  projectId: number,
  identifier: string,
) {
  const token = await createToken({ projectId, identifier });

  // TODO: Save to db

  return token;
}

export async function verifyConnection(token: string) {
  const payload = await verifyToken(token);

  return payload;
}

export async function connectionJoinRoom(
  db: DBType,
  projectId: number,
  identifier: string,
  roomId: string,
) {
  // TODO: Notify on redis or smth
  // TODO: Save to db
}

export async function connectionLeaveRoom(
  db: DBType,
  projectId: number,
  identifier: string,
  roomId: string,
) {
  // TODO: Notify on redis or smth
  // TODO: Save to db
}

export async function connectionSetRoom(
  db: DBType,
  projectId: number,
  identifier: string,
  roomId: string,
) {
  // TODO: Notify on redis or smth
  // TODO: Save to db
}

export async function getConnectionRooms(
  db: DBType,
  projectId: number,
  identifier: string,
) {
  // TODO: Get from db
}
