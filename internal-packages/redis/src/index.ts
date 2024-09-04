export function getMainChannelName(projectId: number, identifier: string) {
  return `connection:${projectId}:${identifier}`;
}

export function getFeedChannelName(projectId: number, feedName: string) {
  return `feed:${projectId}:${feedName}`;
}

export function getWebhooksCacheName(projectId: number) {
  return `webhooks:${projectId}`;
}
