import { z } from "zod";

import { FeedNameValidator } from "@socketless/shared";

const JoinFeedMessage = z.object({
  type: z.literal("join-feed"),
  data: z.object({
    feed: FeedNameValidator,
  }),
});

const LeaveFeedMessage = z.object({
  type: z.literal("leave-feed"),
  data: z.object({
    feed: FeedNameValidator,
  }),
});

const SetFeedsMessage = z.object({
  type: z.literal("set-feeds"),
  data: z.object({
    feeds: z.array(FeedNameValidator),
  }),
});

const SendMessage = z.object({
  type: z.literal("send-message"),
  data: z.object({
    message: z.string(),
  }),
});

export const RedisMessageSchema = z.union([
  JoinFeedMessage,
  LeaveFeedMessage,
  SetFeedsMessage,
  SendMessage,
]);

export type RedisMessageType = z.infer<typeof RedisMessageSchema>;
