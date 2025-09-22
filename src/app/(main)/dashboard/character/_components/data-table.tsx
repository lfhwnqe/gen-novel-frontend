"use client";

import * as React from "react";
import { Search, SlidersHorizontal, Plus, EllipsisVertical, RefreshCcw, FileText, Link2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";
import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { QueryActionBar } from "@/components/layouts/query-action-bar";
import { useFetchWithAuth } from "@/utils/fetch-with-auth";
import { Character } from "@/types/work";
import { CharacterDetailDialog } from "./character-detail-dialog";

import { CreateCharacterDialog } from "./create-product-dialog";
import { EditCharacterDialog } from "./edit-work-dialog";
import { CreateRelationshipEventDialog } from "./create-relationship-event-dialog";

interface CharacterTableProps {
  data: Character[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: { novelId?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) => void;
  onQuery?: () => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export function CharacterDataTable({
  data: initialData,
  loading = false,
  error = null,
  onRefresh,
  onSearch,
  onFilter,
  onQuery,
  pagination,
}: CharacterTableProps) {
  const fetchWithAuth = useFetchWithAuth();
  const [data, setData] = React.useState<Character[]>(() => initialData);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [novelFilter, setNovelFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [currentCharacter, setCurrentCharacter] = React.useState<Character | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailData, setDetailData] = React.useState<Character | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [relationshipOpen, setRelationshipOpen] = React.useState(false);
  const [relationshipInitial, setRelationshipInitial] = React.useState<{
    characterAId?: string;
    characterBId?: string;
    novelId?: string;
  } | null>(null);

  const columns = React.useMemo<ColumnDef<Character>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="全选当前页"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="选择当前行"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="角色名称" />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "role",
        header: ({ column }) => <DataTableColumnHeader column={column} title="角色定位" />,
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.role || "-"}</span>,
      },
      {
        accessorKey: "traits",
        header: ({ column }) => <DataTableColumnHeader column={column} title="性格特质" />,
        cell: ({ row }) => {
          const traits = row.original.traits;
          if (!traits) return <span className="text-muted-foreground text-sm">-</span>;
          const list = Array.isArray(traits)
            ? traits
            : String(traits)
                .split(/[,\s]+/)
                .filter(Boolean);
          return <span className="text-muted-foreground text-sm">{list.length ? list.join("、") : "-"}</span>;
        },
      },
      {
        accessorKey: "novelName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="所属小说" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">{row.original.novelName || "-"}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
        cell: ({ row }) => {
          const value = row.original.createdAt;
          return (
            <span className="text-muted-foreground text-xs">
              {value ? new Date(value).toLocaleString("zh-CN") : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="更新时间" />,
        cell: ({ row }) => {
          const value = row.original.updatedAt;
          return (
            <span className="text-muted-foreground text-xs">
              {value ? new Date(value).toLocaleString("zh-CN") : "-"}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        meta: { sticky: "right" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
                size="icon"
              >
                <EllipsisVertical />
                <span className="sr-only">打开操作菜单</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={async () => {
                  setDetailError(null);
                  setDetailOpen(true);
                  setDetailLoading(true);
                  setDetailData(row.original);
                  try {
                    const res = await fetchWithAuth(`/api/v1/novels/characters/${row.original.characterId}`, {
                      method: "GET",
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}) as any);
                      const message =
                        err?.message?.message || err?.message || `获取详情失败: ${res.status} ${res.statusText}`;
                      throw new Error(message);
                    }
                    const json = await res.json().catch(() => null);
                    const data =
                      json && typeof json === "object" && "success" in json && "data" in json
                        ? (json.data as Character)
                        : (json as Character);
                    setDetailData(data);
                  } catch (err: any) {
                    setDetailData(null);
                    setDetailError(err?.message || "获取详情失败");
                  } finally {
                    setDetailLoading(false);
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" /> 查看详情
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentCharacter(row.original);
                  setEditOpen(true);
                }}
              >
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={deletingId === row.original.characterId}
                onClick={async () => {
                  if (!confirm(`确认删除角色“${row.original.name}”吗？`)) return;
                  setDeletingId(row.original.characterId);
                  try {
                    const res = await fetchWithAuth(`/api/v1/novels/characters/${row.original.characterId}`, {
                      method: "DELETE",
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}) as any);
                      const message = err?.message?.message || err?.message || "删除角色失败";
                      throw new Error(message);
                    }
                    toast.success("角色已删除");
                    onRefresh?.();
                    onQuery?.();
                  } catch (e: any) {
                    toast.error(e?.message || "删除角色失败");
                  } finally {
                    setDeletingId(null);
                  }
                }}
              >
                {deletingId === row.original.characterId ? "删除中..." : "删除"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [deletingId, fetchWithAuth, onQuery, onRefresh],
  );

  const table = useDataTableInstance<Character>({
    data,
    columns,
    getRowId: (row) => row.characterId,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

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
  }, [pagination?.page, pagination?.limit, table]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleNovelChange = (value: string) => {
    setNovelFilter(value);
    onFilter?.({ novelId: value.trim() || undefined, sortBy, sortOrder });
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    onFilter?.({ novelId: novelFilter.trim() || undefined, sortBy: value, sortOrder });
  };

  const handleSortOrderChange = (value: "asc" | "desc") => {
    setSortOrder(value);
    onFilter?.({ novelId: novelFilter.trim() || undefined, sortBy, sortOrder: value });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="text-destructive text-sm">加载角色数据时出错: {error}</div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="mb-6">
        <QueryActionBar
          left={
            <>
              <div className="relative max-w-sm min-w-[220px] flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="搜索角色名称..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="所属小说 ID"
                  value={novelFilter}
                  onChange={(e) => handleNovelChange(e.target.value)}
                  className="w-48"
                />
                <Select value={sortBy} onValueChange={handleSortByChange}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="排序字段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">创建时间</SelectItem>
                    <SelectItem value="updatedAt">更新时间</SelectItem>
                    <SelectItem value="name">角色名称</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(value) => handleSortOrderChange(value as "asc" | "desc")}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">降序</SelectItem>
                    <SelectItem value="asc">升序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => onQuery?.()} disabled={loading}>
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
                onClick={() => {
                  onRefresh?.();
                }}
                disabled={loading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> 刷新
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                title={
                  selectedCount === 2 ? "已根据所选行预填两个角色" : "可直接打开弹窗搜索角色；勾选两名角色将自动预填"
                }
                onClick={() => {
                  const first = selectedRows[0]?.original;
                  const second = selectedRows[1]?.original;
                  const initial: {
                    characterAId?: string;
                    characterBId?: string;
                    novelId?: string;
                  } = {};
                  if (first) {
                    initial.characterAId = first.characterId;
                  }
                  if (second) {
                    initial.characterBId = second.characterId;
                  }
                  const preferNovelId =
                    first?.novelId && second?.novelId && first.novelId === second.novelId
                      ? first.novelId
                      : (first?.novelId ?? second?.novelId ?? "");
                  if (preferNovelId) {
                    initial.novelId = preferNovelId;
                  }
                  setRelationshipInitial(Object.keys(initial).length ? initial : null);
                  setRelationshipOpen(true);
                }}
              >
                <Link2 className="mr-2 h-4 w-4" /> 创建关系事件
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> 新增角色
              </Button>
            </>
          }
        />
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew table={table} columns={columns} loading={loading} />
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

      <CharacterDetailDialog
        open={detailOpen}
        loading={detailLoading}
        character={detailData}
        error={detailError}
        onClose={() => {
          setDetailOpen(false);
          setDetailData(null);
          setDetailError(null);
        }}
      />

      <CreateCharacterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />

      <EditCharacterDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        character={currentCharacter}
        onUpdated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />

      <CreateRelationshipEventDialog
        open={relationshipOpen}
        onOpenChange={(value) => {
          setRelationshipOpen(value);
          if (!value) {
            setRelationshipInitial(null);
          }
        }}
        initialCharacters={data}
        initialSelection={relationshipInitial ?? undefined}
        onCreated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />
    </div>
  );
}
