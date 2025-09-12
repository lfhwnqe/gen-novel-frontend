import { Table } from "@tanstack/react-table";
import { ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServerPaginationBinding {
  // 服务端分页：当前页（1-based）
  page: number;
  // 每页数量
  pageSize: number;
  // 总条数
  total: number;
  // 总页数
  pageCount: number;
  // 切换页码（1-based）
  onPageChange: (page: number) => void;
  // 切换每页数量
  onPageSizeChange: (size: number) => void;
  // 可选：加载态
  loading?: boolean;
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  server?: ServerPaginationBinding;
}

export function DataTablePagination<TData>({ table, server }: DataTablePaginationProps<TData>) {
  // 客户端分页（默认）
  const client = {
    page: table.getState().pagination.pageIndex + 1,
    pageSize: table.getState().pagination.pageSize,
    pageCount: table.getPageCount(),
    total: table.getFilteredRowModel().rows.length,
    canPrev: table.getCanPreviousPage(),
    canNext: table.getCanNextPage(),
    goFirst: () => table.setPageIndex(0),
    goPrev: () => table.previousPage(),
    goNext: () => table.nextPage(),
    goLast: () => table.setPageIndex(table.getPageCount() - 1),
    setPageSize: (size: number) => table.setPageSize(size),
  };

  // 若提供了服务端分页绑定，则用它覆盖显示与交互
  const active = server
    ? {
        page: server.page,
        pageSize: server.pageSize,
        pageCount: server.pageCount,
        total: server.total,
        canPrev: server.page > 1,
        canNext: server.page < server.pageCount,
        goFirst: () => server.onPageChange(1),
        goPrev: () => server.onPageChange(Math.max(1, server.page - 1)),
        goNext: () => server.onPageChange(Math.min(server.pageCount, server.page + 1)),
        goLast: () => server.onPageChange(server.pageCount),
        setPageSize: (size: number) => server.onPageSizeChange(size),
        loading: server.loading,
      }
    : client;

  // 统一跳转到指定页（1-based）
  const gotoPage = (p: number) => {
    const target = Math.min(Math.max(1, p), active.pageCount || 1);
    if (server) {
      server.onPageChange(target);
    } else {
      table.setPageIndex(target - 1);
    }
  };

  // 生成紧凑页码列表（含省略号）
  const buildPageItems = (current: number, total: number) => {
    const items: (number | "ellipsis")[] = [];
    if (!total || total <= 0) return items;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) items.push(i);
      return items;
    }
    const left = Math.max(2, current - 2);
    const right = Math.min(total - 1, current + 2);
    items.push(1);
    if (left > 2) items.push("ellipsis");
    else if (left === 2) items.push(2);
    for (let i = Math.max(3, left); i <= Math.max(left, right); i++) {
      if (i > 1 && i < total) items.push(i);
    }
    if (right < total - 1) items.push("ellipsis");
    else if (right === total - 1) items.push(total - 1);
    items.push(total);
    return items;
  };
  const pageItems = buildPageItems(active.page, active.pageCount);

  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {/* 选中计数（仍使用客户端表格的选择模型） */}
        {table.getFilteredSelectedRowModel().rows.length} / {active.total} 已选
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            每页
          </Label>
          <Select
            value={`${active.pageSize}`}
            onValueChange={(value) => {
              active.setPageSize(Number(value));
            }}
            disabled={!!server?.loading}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={active.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          第 {active.page} / {active.pageCount} 页（共 {active.total} 条）
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={active.goFirst}
            disabled={!active.canPrev || !!server?.loading}
          >
            <span className="sr-only">第一页</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={active.goPrev}
            disabled={!active.canPrev || !!server?.loading}
          >
            <span className="sr-only">上一页</span>
            <ChevronLeft />
          </Button>
          {/* 数字页码选择 */}
          <div className="hidden items-center gap-1 md:flex">
            {pageItems.map((it, idx) =>
              it === "ellipsis" ? (
                <span key={`e-${idx}`} className="text-muted-foreground px-1 select-none">
                  …
                </span>
              ) : (
                <Button
                  key={it}
                  variant={it === active.page ? "default" : "outline"}
                  className="h-8 w-8 p-0"
                  size="icon"
                  onClick={() => gotoPage(it)}
                  disabled={!!server?.loading || it === active.page}
                  aria-current={it === active.page ? "page" : undefined}
                >
                  {it}
                </Button>
              ),
            )}
          </div>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={active.goNext}
            disabled={!active.canNext || !!server?.loading}
          >
            <span className="sr-only">下一页</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={active.goLast}
            disabled={!active.canNext || !!server?.loading}
          >
            <span className="sr-only">最后一页</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
