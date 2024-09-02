import { z } from "zod";

import { RoomNameValidator } from "@socketless/shared";

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

const SetRoomsMessage = z.object({
  type: z.literal("set-rooms"),
  data: z.object({
    rooms: z.array(RoomNameValidator),
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
  SetRoomsMessage,
  SendMessage,
]);

export type RedisMessageType = z.infer<typeof RedisMessageSchema>;
