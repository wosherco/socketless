import { z } from "zod";

import { RoomNameValidator } from "@socketless/validators";

const JoinRoomMessage = z.object({
  type: z.literal("join-room"),
  data: z.object({
    room: RoomNameValidator,
  }),
});

const LeaveRoomMessage = z.object({
  type: z.literal("leave-room"),
  data: z.object({
    room: RoomNameValidator,
  }),
});

const SendMessage = z.object({
  type: z.literal("send-message"),
  data: z.object({
    message: z.string(),
  }),
});

export const RedisMessageSchema = z.union([
  JoinRoomMessage,
  LeaveRoomMessage,
  SendMessage,
]);

export type RedisMessageType = z.infer<typeof RedisMessageSchema>;
