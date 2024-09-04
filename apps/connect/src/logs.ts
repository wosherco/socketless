import type { DBType } from "@socketless/db/client";
import type { RedisType } from "@socketless/redis/client";

export class LogsManager {
  private db: DBType;
  private redis: RedisType;

  constructor(db: DBType, redis: RedisType) {
    this.db = db;
    this.redis = redis;
  }

  public async logIncomingMessage() {
    // TODO: Implement
  }
  public async logOutgointMessage() {
    // TODO: Implement
  }
  public async logConnection() {
    // TODO: Implement
  }
  public async logDisconnection() {
    // TODO: Implement
  }
}
