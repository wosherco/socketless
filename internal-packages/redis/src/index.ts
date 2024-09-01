export function getMainChannelName(projectId: number, identifier: string) {
  return `connection:${projectId}:${identifier}`;
}

export function getRoomChannelName(projectId: number, roomId: string) {
  return `room:${projectId}:${roomId}`;
}