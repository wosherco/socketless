import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";

export class UsageManager {
  private db: DBType;
  private redis: RedisType;

  constructor(db: DBType, redis: RedisType) {
    this.db = db;
    this.redis = redis;
  }

  public async canConnect(projectId: number): Promise<boolean> {
    // TODO: Implement
  }

  public async canSendMessage(projectId: number) {
    // TODO: Implement
  }
}
