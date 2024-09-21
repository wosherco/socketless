"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { LogAction } from "@socketless/db/schema";
import type { DateLogsFilter } from "@socketless/validators";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@socketless/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@socketless/ui/select";
import { DATES } from "@socketless/validators";

import type { Option } from "../utility/MultipleSelect";
import MultipleSelector from "../utility/MultipleSelect";

export function DatePicker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  let date = searchParams.get("date") ?? "last24";

  if (!DATES.includes(date as DateLogsFilter)) {
    date = "last24";
  }

  function changeDate(date: string) {
    const params = new URLSearchParams(searchParams);

    params.set("date", date);

    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select onValueChange={(newDate) => changeDate(newDate)} value={date}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="last24">Last 24 Hours</SelectItem>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="yesterday">Yesterday</SelectItem>
        <SelectItem value="last7">Last 7 Days</SelectItem>
        <SelectItem value="last30">Last 30 Days</SelectItem>
      </SelectContent>
    </Select>
  );
}

const FilterOptions: Option[] = [
  { value: "INCOMING", label: "Incoming" },
  { value: "OUTGOING", label: "Outgoing" },
  { value: "CONNECTION", label: "Connection" },
  { value: "DISCONNECT", label: "Disconnect" },
] satisfies { value: LogAction; label: string }[];

export function FilterPicker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filterraw = searchParams.get("filter") ?? "";
  const filter = filterraw.split(",");

  const currentOptions: Option[] = FilterOptions.filter((option) =>
    filter.includes(option.value),
  );

  function changeFilters(val: string) {
    const params = new URLSearchParams(searchParams);

    params.set("filter", val);

    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <MultipleSelector
      onChange={(newFilters) =>
        changeFilters(newFilters.map((filter) => filter.value).join(","))
      }
      defaultOptions={FilterOptions}
      value={currentOptions}
    />
  );
}

export function PagePicker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const limitraw = parseInt(searchParams.get("limit") ?? "20");
  const offsetraw = parseInt(searchParams.get("offset") ?? "0");

  let limit = 20;
  let offset = 0;

  if (!isNaN(limitraw) || limitraw >= 0) {
    limit = limitraw;
  }

  if (!isNaN(offsetraw) || offsetraw >= 0) {
    offset = offsetraw;
  }

  function changePage(limit: string, offset: string) {
    const params = new URLSearchParams(searchParams);

    params.set("limit", limit);
    params.set("offset", offset);

    router.replace(`${pathname}?${params.toString()}`);
  }

  function nextPage() {
    const newOffset = offset + limit;

    changePage(limit.toString(), newOffset.toString());
  }

  function previousPage() {
    const newOffset = Math.max(offset - limit, 0);

    changePage(limit.toString(), newOffset.toString());
  }

  function getCurrentPage() {
    return Math.floor(offset / limit) + 1;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className="cursor-pointer"
            onClick={previousPage}
          />
        </PaginationItem>
        <PaginationItem>
          <p className="px-2">{getCurrentPage()}</p>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext className="cursor-pointer" onCanPlay={nextPage} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
