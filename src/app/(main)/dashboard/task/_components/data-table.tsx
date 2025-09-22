"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Filter, RefreshCw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";
import { DataTable as BaseDataTable } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { QueryActionBar } from "@/components/layouts/query-action-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { TaskItem, TaskStatus, TASK_STATUSES } from "@/types/task";
import { TaskType } from "@/types/work";

const TASK_TYPE_LABELS: Record<string, string> = {
  [TaskType.SCENARIO_OUTLINE]: "剧情大纲",
  [TaskType.WORLDBUILDING]: "世界观设定",
};

const statusConfig: Record<
  TaskStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  queued: { label: "排队中", variant: "outline" },
  running: { label: "运行中", variant: "secondary" },
  success: { label: "成功", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
};

type TaskFilters = {
  type?: string;
  status?: TaskStatus;
  novelId?: string;
};

interface TaskDataTableProps {
  data: TaskItem[];
  loading?: boolean;
  filters?: TaskFilters;
  onFilterChange?: (partial: Partial<TaskFilters>) => void;
  onQuery?: () => void;
  onRefresh?: () => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export function TaskDataTable({
  data: initialData,
  loading = false,
  filters,
  onFilterChange,
  onQuery,
  onRefresh,
  pagination,
}: TaskDataTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [detailTask, setDetailTask] = React.useState<TaskItem | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<TaskItem>[]>(
    () => [
      {
        accessorKey: "novelName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="小说名称" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">{row.original.novelName || "-"}</span>
        ),
        meta: { minWidth: 140 },
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="任务类型" />,
        cell: ({ row }) => {
          const label = TASK_TYPE_LABELS[row.original.type] ?? row.original.type;
          return <span className="text-sm font-medium">{label}</span>;
        },
        meta: { minWidth: 140 },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
        cell: ({ row }) => {
          const status = row.original.status;
          const cfg = statusConfig[status] ?? { label: status, variant: "outline" };
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
        meta: { width: 100 },
      },
      {
        accessorKey: "prompt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Prompt" />,
        cell: ({ row }) => {
          const prompt = row.original.prompt;

          if (!prompt) {
            return <span className="text-muted-foreground text-xs">-</span>;
          }

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground block max-w-[280px] truncate text-xs">{prompt}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed break-words whitespace-pre-line">
                {prompt}
              </TooltipContent>
            </Tooltip>
          );
        },
        meta: { minWidth: 200 },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
        cell: ({ row }) => {
          const value = row.original.createdAt;
          const date = value ? new Date(value) : null;
          return <span className="text-muted-foreground text-xs">{date ? date.toLocaleString("zh-CN") : "-"}</span>;
        },
        meta: { width: 160 },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="更新时间" />,
        cell: ({ row }) => {
          const value = row.original.updatedAt;
          const date = value ? new Date(value) : null;
          return <span className="text-muted-foreground text-xs">{date ? date.toLocaleString("zh-CN") : "-"}</span>;
        },
        meta: { width: 160 },
      },
      {
        id: "details",
        header: "详情",
        cell: ({ row }) => (
          <Button
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => {
              setDetailTask(row.original);
              setDetailOpen(true);
            }}
          >
            查看
          </Button>
        ),
        enableSorting: false,
        meta: { width: 80 },
      },
    ],
    [],
  );

  const table = useDataTableInstance({ data, columns, getRowId: (row) => row.taskId });

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    if (pagination) {
      const safePage = Math.max(1, pagination.page);
      if (table.getState().pagination.pageIndex !== safePage - 1) {
        table.setPageIndex(safePage - 1);
      }
      if (table.getState().pagination.pageSize !== pagination.limit) {
        table.setPageSize(pagination.limit);
      }
    }
  }, [pagination?.page, pagination?.limit]);

  const handleStatusChange = (value: string) => {
    onFilterChange?.({
      status: value === "all" ? undefined : (value as TaskStatus),
    });
  };

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="mb-6">
        <QueryActionBar
          left={
            <>
              <div className="flex min-w-[240px] flex-1 flex-wrap gap-2">
                <Input
                  placeholder="任务类型"
                  value={filters?.type ?? ""}
                  onChange={(event) => onFilterChange?.({ type: event.target.value || undefined })}
                  className="min-w-[160px] flex-1"
                />
                <Input
                  placeholder="小说 ID"
                  value={filters?.novelId ?? ""}
                  onChange={(event) => onFilterChange?.({ novelId: event.target.value || undefined })}
                  className="min-w-[160px] flex-1"
                />
              </div>
              <Select value={filters?.status ?? "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="任务状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => onQuery?.()}>
                <Search className="mr-2 h-4 w-4" /> 查询
              </Button>
            </>
          }
          right={
            <>
              <DataTableViewOptions table={table} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterChange?.({ type: undefined, status: undefined, novelId: undefined })}
              >
                清空条件
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> 刷新
              </Button>
            </>
          }
        />
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <BaseDataTable table={table} columns={columns} loading={loading} />
        </div>
        <DataTablePagination
          table={table}
          server={
            pagination
              ? {
                  page: pagination.page,
                  pageSize: pagination.limit,
                  pageCount: pagination.totalPages,
                  total: pagination.total,
                  onPageChange: pagination.onPageChange,
                  onPageSizeChange: pagination.onPageSizeChange,
                  loading,
                }
              : undefined
          }
        />
      </div>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailTask(null);
          }
        }}
      >
        <DialogContent className="max-h-[70vh] overflow-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>查看任务返回的 result 与 error 字段。</DialogDescription>
          </DialogHeader>
          {detailTask ? (
            <div className="space-y-4">
              <section>
                <Label className="text-muted-foreground text-xs font-medium uppercase">任务信息</Label>
                <div className="mt-2 grid gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground mr-2">任务 ID:</span>
                    <span className="font-mono">{detailTask.taskId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-2">任务类型:</span>
                    <span>{detailTask.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-2">状态:</span>
                    <Badge variant={statusConfig[detailTask.status].variant}>
                      {statusConfig[detailTask.status].label}
                    </Badge>
                  </div>
                  {detailTask.novelId && (
                    <div>
                      <span className="text-muted-foreground mr-2">小说 ID:</span>
                      <span className="font-mono">{detailTask.novelId}</span>
                    </div>
                  )}
                </div>
              </section>
              <section>
                <Label className="text-muted-foreground text-xs font-medium uppercase">Prompt</Label>
                <pre className="bg-muted/50 mt-2 max-h-48 overflow-auto rounded-md p-3 text-xs">
                  {detailTask.prompt || "-"}
                </pre>
              </section>
              <section>
                <Label className="text-muted-foreground text-xs font-medium uppercase">Result</Label>
                <pre className="bg-muted/50 mt-2 max-h-48 overflow-auto rounded-md p-3 text-xs">
                  {stringifyJson(detailTask.result)}
                </pre>
              </section>
              <section>
                <Label className="text-muted-foreground text-xs font-medium uppercase">Error</Label>
                <pre className="bg-muted/50 mt-2 max-h-48 overflow-auto rounded-md p-3 text-xs">
                  {stringifyJson(detailTask.error)}
                </pre>
              </section>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">未选择任务。</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function stringifyJson(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
