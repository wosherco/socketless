import Redis from "ioredis";

import { env } from "../env";

export const createRedisClient = () => new Redis(env.REDIS_URL);

export type RedisType = ReturnType<typeof createRedisClient>;
