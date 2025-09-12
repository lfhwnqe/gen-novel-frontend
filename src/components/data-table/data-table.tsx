import * as React from "react";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DndContext,
  closestCenter,
  type UniqueIdentifier,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { ColumnDef, flexRender, type Table as TanStackTable } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

import { DraggableRow } from "./draggable-row";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  dndEnabled?: boolean;
  onReorder?: (newData: TData[]) => void;
  loading?: boolean;
}

function renderTableBody<TData, TValue>({
  table,
  columns,
  dndEnabled,
  dataIds,
  loading,
}: {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, TValue>[];
  dndEnabled: boolean;
  dataIds: UniqueIdentifier[];
  loading?: boolean;
}) {
  // 整体 Loading：在表体用一行统一展示
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-40">
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              <div className="text-muted-foreground mt-2 text-sm">加载中...</div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  }
  if (!table.getRowModel().rows.length) {
    return (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          No results.
        </TableCell>
      </TableRow>
    );
  }
  if (dndEnabled) {
    return (
      <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
        {table.getRowModel().rows.map((row) => (
          <DraggableRow key={row.id} row={row} />
        ))}
      </SortableContext>
    );
  }
  return table.getRowModel().rows.map((row) => (
    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => {
        const meta = (cell.column.columnDef.meta || {}) as { sticky?: "left" | "right" };
        const stickyCls =
          meta.sticky === "right"
            ? "sticky right-0 z-10 bg-background border-l"
            : meta.sticky === "left"
              ? "sticky left-0 z-10 bg-background border-r"
              : undefined;
        return (
          <TableCell key={cell.id} className={cn(stickyCls)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  ));
}

export function DataTable<TData, TValue>({
  table,
  columns,
  dndEnabled = false,
  onReorder,
  loading,
}: DataTableProps<TData, TValue>) {
  const dataIds: UniqueIdentifier[] = table.getRowModel().rows.map((row) => Number(row.id) as UniqueIdentifier);
  const sortableId = React.useId();
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id && onReorder) {
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);

      // Call parent with new data order (parent manages state)
      const newData = arrayMove(table.options.data, oldIndex, newIndex);
      onReorder(newData);
    }
  }

  const tableElement = (
    <Table>
      <TableHeader className="bg-muted sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = (header.column.columnDef.meta || {}) as { sticky?: "left" | "right" };
              const stickyCls =
                meta.sticky === "right"
                  ? "sticky right-0 z-20 bg-background"
                  : meta.sticky === "left"
                    ? "sticky left-0 z-20 bg-background"
                    : undefined;
              return (
                <TableHead key={header.id} colSpan={header.colSpan} className={cn(stickyCls)}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="**:data-[slot=table-cell]:first:w-8">
        {renderTableBody({ table, columns, dndEnabled, dataIds, loading })}
      </TableBody>
    </Table>
  );

  if (dndEnabled) {
    return (
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        id={sortableId}
      >
        {tableElement}
      </DndContext>
    );
  }

  return tableElement;
}
