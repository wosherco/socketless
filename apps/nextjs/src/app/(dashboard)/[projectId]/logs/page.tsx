import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { LogAction } from "@socketless/db/schema";
import type { DateLogsFilter } from "@socketless/validators";
import { LOG_ACTIONS } from "@socketless/db/schema";

import {
  DatePicker,
  FilterPicker,
  PagePicker,
} from "~/components/dashboard/LogFilters";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Logs",
};

export default function Page({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const parsedProjectId = parseInt(params.projectId);
  if (isNaN(parsedProjectId)) {
    notFound();
  }

  let limit: number | undefined;
  let offset: number | undefined;
  let filters: LogAction[] = [];
  let dateFilter: DateLogsFilter | undefined;

  if (searchParams.filter !== undefined) {
    const tempfilters = Array.isArray(searchParams.filter)
      ? searchParams.filter
      : searchParams.filter.split(",");

    filters = tempfilters.filter(
      (t, index, self) =>
        LOG_ACTIONS.includes(t as LogAction) && self.indexOf(t) === index,
    ) as LogAction[];
  }

  if (searchParams.limit !== undefined && !Array.isArray(searchParams.limit)) {
    limit = parseInt(searchParams.limit);
    if (isNaN(limit)) {
      limit = undefined;
    }
  }

  if (
    searchParams.offset !== undefined &&
    !Array.isArray(searchParams.offset)
  ) {
    offset = parseInt(searchParams.offset);
    if (isNaN(offset)) {
      offset = undefined;
    }
  }

  return (
    <>
      <h1 className="text-xl font-medium">Logs</h1>
      <h2 className="text-sm text-muted-foreground">
        Check out your project's logs here.
      </h2>

      <div className="my-4 flex gap-4">
        <DatePicker />
        <div className="flex flex-row items-center gap-2">
          <p>Filters:</p>
          <FilterPicker />
        </div>
      </div>

      <LogsList
        projectId={parsedProjectId}
        filter={filters}
        limit={limit}
        offset={offset}
        dateFilter={dateFilter}
      />

      <PagePicker />
    </>
  );
}

async function LogsList({
  projectId,
  limit,
  offset,
  filter,
  dateFilter,
}: {
  projectId: number;
  limit?: number;
  offset?: number;
  filter?: LogAction[];
  dateFilter?: DateLogsFilter;
}) {
  const logs = await api.projectLogs.getLogs({
    projectId,
    limit,
    offset,
    filter,
    dateFilter,
  });

  return (
    <ul>
      {logs.map((log) => (
        <li key={`${log.timestamp.toLocaleString("en-US")} - ${log.action}`}>
          {log.action} - <code>{log.timestamp.toLocaleString("en-US")}</code>
        </li>
      ))}
    </ul>
  );
}
