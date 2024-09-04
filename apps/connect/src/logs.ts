import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";
import { logsTable } from "@socketless/db/schema";

export class LogsManager {
  private db: DBType;
  private redis: RedisType;

  constructor(db: DBType, redis: RedisType) {
    this.db = db;
    this.redis = redis;
  }

  private async log(
    projectId: number,
    action: "INCOMING" | "OUTGOING" | "CONNECTION" | "DISCONNECT",
    data: unknown,
  ) {
    await this.db.insert(logsTable).values({
      action,
      projectId,
      data,
    });
  }

  public async logIncomingMessage(
    projectId: number,
    identifier: string,
    message: unknown,
    feeds?: string[],
    users?: string[],
  ) {
    return this.log(projectId, "INCOMING", {
      identifier,
      message,
      feeds,
      users,
    });
  }

  public async logOutgointMessage(
    projectId: number,
    identifier: string,
    message: unknown,
  ) {
    return this.log(projectId, "OUTGOING", { identifier, message });
  }

  public async logConnection(
    projectId: number,
    identifier: string,
    feeds: string[],
  ) {
    return this.log(projectId, "CONNECTION", { identifier, feeds });
  }

  // TODO: Add more info about the disconnection
  public async logDisconnection(projectId: number, identifier: string) {
    return this.log(projectId, "DISCONNECT", { identifier });
  }
}
