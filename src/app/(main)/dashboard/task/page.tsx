"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";

import { TaskDataTable } from "./_components/data-table";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { TaskListResponse, TaskStatus } from "@/types/task";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  message?: unknown;
}

interface QueryParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: TaskStatus;
  novelId?: string;
}

interface QueryFilters {
  type?: string;
  status?: TaskStatus;
  novelId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.message?.message || json?.message || `获取任务数据失败: ${res.status} ${res.statusText}`;
    throw new Error(typeof message === "string" ? message : "获取任务数据失败");
  }
  if (json && typeof json === "object" && "success" in json) {
    return (json as ApiResponse<TaskListResponse>).data;
  }
  return json as TaskListResponse;
};

export default function TaskPage() {
  const [enabled, setEnabled] = React.useState(false);
  const [queryParams, setQueryParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
  });
  const [filters, setFilters] = React.useState<QueryFilters>({});

  const paramsString = React.useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        sp.append(key, value.toString());
      }
    });
    return sp.toString();
  }, [queryParams]);

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? `/api/v1/novels/generation/tasks?${paramsString}` : null,
    fetcher,
    {
      keepPreviousData: true,
      shouldRetryOnError: false,
    },
  );

  React.useEffect(() => {
    if (!enabled) {
      setEnabled(true);
    }
  }, [enabled]);

  React.useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const tasks = data?.data ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? queryParams.page ?? 1;
  const limit = data?.limit ?? queryParams.limit ?? 10;
  const totalPages = data?.totalPages ?? (limit ? Math.max(1, Math.ceil(total / limit)) : 1);

  const handleRefresh = () => {
    if (enabled) mutate();
  };

  const handlePageChange = (nextPage: number) => {
    setQueryParams((prev) => {
      const next = { ...(prev || {}), page: Math.max(1, nextPage) };
      return next;
    });
    setEnabled(true);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setQueryParams((prev) => {
      const next = { ...(prev || {}), limit: nextSize, page: 1 };
      return next;
    });
    setEnabled(true);
  };

  const handleFilterChange = (partial: Partial<QueryFilters>) => {
    setFilters((prev) => {
      const next = { ...(prev || {}), ...partial } as QueryFilters;
      const cleanedEntries = Object.entries(next).filter(([, value]) => value !== undefined && value !== "");
      return Object.fromEntries(cleanedEntries) as QueryFilters;
    });
  };

  const handleQuery = () => {
    setQueryParams((prev) => {
      const next: QueryParams = {
        ...(prev || {}),
        page: 1,
        type: filters.type,
        status: filters.status,
        novelId: filters.novelId,
      };
      Object.keys(next).forEach((key) => {
        const value = next[key as keyof QueryParams];
        if (value === undefined || value === "") {
          delete next[key as keyof QueryParams];
        }
      });
      return next;
    });
    setEnabled(true);
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <TaskDataTable
        data={tasks}
        loading={isLoading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onQuery={handleQuery}
        onRefresh={handleRefresh}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    </div>
  );
}
