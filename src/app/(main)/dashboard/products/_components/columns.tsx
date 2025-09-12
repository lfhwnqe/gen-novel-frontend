import { ColumnDef } from "@tanstack/react-table";
import { CircleCheck, Loader, EllipsisVertical, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { customerSchema, sectionSchema, CustomerStatus, RiskLevel } from "./schema";
import { TableCellViewer } from "./table-cell-viewer";
import { Product, ProductStatus, ProductType, RiskLevel as ProductRiskLevel } from "@/types/product";

type Customer = z.infer<typeof customerSchema>;

// 客户列定义工厂，支持注入操作回调
export function getCustomerColumns(opts?: {
  onViewDetail?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
}): ColumnDef<Customer>[] {
  const onViewDetail = opts?.onViewDetail;
  const onEdit = opts?.onEdit;
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="姓名" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="text-muted-foreground h-4 w-4" />
          <span>
            {row.original.lastName}
            {row.original.firstName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="邮箱" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <DataTableColumnHeader column={column} title="手机号" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = {
          [CustomerStatus.ACTIVE]: { label: "活跃", variant: "default" as const },
          [CustomerStatus.INACTIVE]: { label: "非活跃", variant: "secondary" as const },
          [CustomerStatus.SUSPENDED]: { label: "暂停", variant: "destructive" as const },
        };

        const config = statusConfig[status] || { label: status, variant: "outline" as const };

        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "riskLevel",
      header: ({ column }) => <DataTableColumnHeader column={column} title="风险等级" />,
      cell: ({ row }) => {
        const riskLevel = row.original.riskLevel;
        const riskConfig = {
          [RiskLevel.LOW]: { label: "低", variant: "outline" as const },
          [RiskLevel.MEDIUM]: { label: "中", variant: "secondary" as const },
          [RiskLevel.HIGH]: { label: "高", variant: "destructive" as const },
        };

        const config = riskConfig[riskLevel] || { label: riskLevel, variant: "outline" as const };

        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <div className="text-muted-foreground text-sm">{date.toLocaleDateString("zh-CN")}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onViewDetail?.(row.original)}>查看详情</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(row.original)}>编辑</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      meta: { sticky: "right" },
    },
  ];
}

// 默认列（无操作回调），兼容旧用法
export const customerColumns: ColumnDef<Customer>[] = getCustomerColumns();

// 产品列定义
export function getProductColumns(opts?: {
  onViewDetail?: (product: Product) => void;
  onEdit?: (product: Product) => void;
}): ColumnDef<Product>[] {
  const onViewDetail = opts?.onViewDetail;
  const onEdit = opts?.onEdit;
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "productName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="产品名称" />,
      cell: ({ row }) => <div className="text-sm font-medium">{row.original.productName}</div>,
    },
    {
      accessorKey: "productType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="产品类型" />,
      cell: ({ row }) => {
        const type = row.original.productType;
        return <Badge variant="outline">{type}</Badge>;
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "riskLevel",
      header: ({ column }) => <DataTableColumnHeader column={column} title="风险等级" />,
      cell: ({ row }) => {
        const riskLevel = row.original.riskLevel;
        const riskConfig = {
          [ProductRiskLevel.LOW]: { label: "低", variant: "outline" as const },
          [ProductRiskLevel.MEDIUM]: { label: "中", variant: "secondary" as const },
          [ProductRiskLevel.HIGH]: { label: "高", variant: "destructive" as const },
        };
        const config = riskConfig[riskLevel] || { label: String(riskLevel), variant: "outline" as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "expectedReturn",
      header: ({ column }) => <DataTableColumnHeader column={column} title="预期年化(%)" />,
      cell: ({ row }) => <div className="text-sm">{row.original.expectedReturn}%</div>,
    },
    {
      accessorKey: "minInvestment",
      header: ({ column }) => <DataTableColumnHeader column={column} title="最低投资" />,
      cell: ({ row }) => <div className="text-sm">{row.original.minInvestment}</div>,
    },
    {
      accessorKey: "maxInvestment",
      header: ({ column }) => <DataTableColumnHeader column={column} title="最高投资" />,
      cell: ({ row }) => <div className="text-sm">{row.original.maxInvestment}</div>,
    },
    {
      accessorKey: "maturityPeriod",
      header: ({ column }) => <DataTableColumnHeader column={column} title="期限(天)" />,
      cell: ({ row }) => <div className="text-sm">{row.original.maturityPeriod}</div>,
    },
    {
      accessorKey: "salesStartDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="销售期" />,
      cell: ({ row }) => (
        <div className="text-muted-foreground text-xs">
          {row.original.salesStartDate} ~ {row.original.salesEndDate}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="状态" />,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig: Record<
          string,
          { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
        > = {
          [ProductStatus.ACTIVE]: { label: "上架", variant: "default" },
          [ProductStatus.INACTIVE]: { label: "下架", variant: "secondary" },
          [ProductStatus.SUSPENDED]: { label: "暂停", variant: "destructive" },
        };
        const config = statusConfig[status] || { label: String(status), variant: "outline" };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="创建时间" />,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <div className="text-muted-foreground text-sm">{date.toLocaleDateString("zh-CN")}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onViewDetail?.(row.original)}>查看详情</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(row.original)}>编辑</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      meta: { sticky: "right" },
    },
  ];
}

export const productColumns: ColumnDef<Product>[] = getProductColumns();

// 保留原有的dashboard columns以防其他地方使用
export const dashboardColumns: ColumnDef<z.infer<typeof sectionSchema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Header" />,
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />;
    },
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Section Type" />,
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Done" ? (
          <CircleCheck className="stroke-border fill-green-500 dark:fill-green-400" />
        ) : (
          <Loader />
        )}
        {row.original.status}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "target",
    header: ({ column }) => <DataTableColumnHeader className="w-full text-right" column={column} title="Target" />,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          });
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Target
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "limit",
    header: ({ column }) => <DataTableColumnHeader className="w-full text-right" column={column} title="Limit" />,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          });
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Limit
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "reviewer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reviewer" />,
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer";

      if (isAssigned) {
        return row.original.reviewer;
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">Jamik Tashpulatov</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
            <EllipsisVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];
