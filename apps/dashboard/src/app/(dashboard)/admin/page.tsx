import { api } from "~/trpc/server";

export default async function AdminPage() {
  const adminStats = await api.admin.getStats();

  return <p>Concurrent connections: {adminStats.concurrentConnections}</p>;
}
